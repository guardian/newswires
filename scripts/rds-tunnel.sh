#!/usr/bin/env bash

usage() {
  echo "Usage:"
  echo "  rds-tunnel --app <value> --stack <value> --stage <value> \
    --region <value> --profile <value> [options]"
  echo ""
  echo "Options:"
  echo "  --app <value>"
  echo "  --stack <value>"
  echo "  --stage <value>"
  echo "  --region <value>"
  echo "  --profile <value>"
  echo "  --rdsapp <value>       Defaults to --app"
  echo "  --rdsstack <value>     Defaults to --stack"
  echo "  --rdsstage <value>     Defaults to --stage"
  echo "  --remote-port <value>  Defaults to 5432"
  echo "  --local-port <value>   Defaults to 5432"
  echo "  --background           Return once the local port is listening"
  exit 1
}

app=""
stack=""
stage=""
region=""
profile=""
rdsapp=""
rdsstack=""
rdsstage=""
remote_port="5432"
local_port="5432"
background=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --background)
      background=true
      shift
      ;;
    --app|--stack|--stage|--region|--profile|--rdsapp|--rdsstack|--rdsstage|--remote-port|--local-port)
      [[ $# -ge 2 && -n $2 ]] || usage
      case "$1" in
        --app) app=$2 ;;
        --stack) stack=$2 ;;
        --stage) stage=$2 ;;
        --region) region=$2 ;;
        --profile) profile=$2 ;;
        --rdsapp) rdsapp=$2 ;;
        --rdsstack) rdsstack=$2 ;;
        --rdsstage) rdsstage=$2 ;;
        --remote-port) remote_port=$2 ;;
        --local-port) local_port=$2 ;;
      esac
      shift 2
      ;;
    *)
      usage
      ;;
  esac
done

rdsapp=${rdsapp:-$app}
rdsstack=${rdsstack:-$stack}
rdsstage=${rdsstage:-$stage}

if [[ -z $app || -z $stack || -z $stage || -z $region || -z $profile ]]; then
   usage
fi

aws sts get-caller-identity --region "$region" --profile "$profile" > /dev/null 2>&1 || { echo "AWS Credentials are NOT valid"; exit 1; }

function getHost() {
  aws rds describe-db-instances \
    --region "$region" \
    --profile "$profile" \
    --query "DBInstances[?
        contains(TagList[?Key=='App'].Value, '$rdsapp') &&
        contains(TagList[?Key=='Stack'].Value, '$rdsstack') &&
        contains(TagList[?Key=='Stage'].Value, '$rdsstage')
    ].Endpoint.Address" \
    --output text
}

host=$(getHost)
if [[ -z $host ]]; then
    echo "No host found"
    exit 1
fi

instance_id=$(aws ec2 describe-instances \
  --region "$region" \
  --profile "$profile" \
    --filters \
        "Name=tag:App,Values=$app" \
        "Name=tag:Stack,Values=$stack" \
        "Name=tag:Stage,Values=$stage" \
        "Name=instance-state-name,Values=running" \
    --query "Reservations[].Instances[] | sort_by(@, &LaunchTime)[-1] | InstanceId" \
  --output text)

if [[ -z $instance_id || $instance_id == "None" ]]; then
  echo "No running instance found"
  exit 1
fi

start_session() {
  exec aws ssm start-session \
      --region "$region" \
      --profile "$profile" \
      --document-name AWS-StartPortForwardingSessionToRemoteHost \
      --parameters "{\"host\":[\"$host\"],\"portNumber\":[\"$remote_port\"],\"localPortNumber\":[\"$local_port\"]}" \
    --target "$instance_id"
}

if [[ "$background" == true ]]; then
  start_session &
  session_pid=$!

  for _ in {1..30}; do
    if ! kill -0 "$session_pid" 2>/dev/null; then
      wait "$session_pid" || true
      echo "Session Manager tunnel failed to start"
      exit 1
    fi
    if lsof -nP -iTCP:"$local_port" -sTCP:LISTEN >/dev/null 2>&1; then
      exit 0
    fi
    sleep 1
  done

  kill "$session_pid" 2>/dev/null || true
  wait "$session_pid" 2>/dev/null || true
  echo "Timed out waiting for tunnel on local port $local_port"
  exit 1
fi

start_session