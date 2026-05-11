#!/usr/bin/env bash

set -e

green='\x1B[0;32m'
red='\x1B[0;31m'
plain='\x1B[0m' # No Color

export AWS_PROFILE='editorial-feeds'
export AWS_REGION=eu-west-1

# The RDS instance itself is listening on default port 5432, but
# we'll open the tunnel on a higher, non-standard port, to try and
# avoid anything accidentally trying to connect on that port (eg.
# a locally running newswires instance).
LOCAL_TUNNEL_PORT=39474
POSTGRES_PORT=5432

APP_NAME='newswires'
TUNNEL_GREP_PATTERN="ssh.* -L $LOCAL_TUNNEL_PORT:editorial-feeds"
EXISTING_TUNNELS="$(pgrep -f "$TUNNEL_GREP_PATTERN" || true)"

if [ "$1" == PROD ]; then
  STAGE=PROD
elif [ "$1" == CODE ]; then
  STAGE=CODE
else
  echo -e "${red}Missing name of stage to connect to.${plain}"
  echo ""
  echo "Usage: $0 <CODE|PROD>"
  echo ""
  exit 1
fi


hasCredentials() {
  STATUS=$(aws sts get-caller-identity --profile ${AWS_PROFILE} 2>&1 || true)
  if [[ ${STATUS} =~ (ExpiredToken) ]]; then
    echo -e "${red}Credentials for the ${AWS_PROFILE} profile are expired. Please fetch new credentials and run this again.${plain}"
    exit 1
  elif [[ ${STATUS} =~ ("could not be found") ]]; then
    echo -e "${red}Credentials for the ${AWS_PROFILE} profile are missing. Please ensure you have the right credentials.${plain}"
    exit 1
  fi
}

openTunnel() {
  if (docker stats --no-stream &> /dev/null); then
    docker compose down
  fi
  if [[ -n "$EXISTING_TUNNELS" ]]; then
    closeTunnels
  fi
  ssm ssh -t $APP_NAME,$STAGE -p $AWS_PROFILE -x --newest --rds-tunnel $LOCAL_TUNNEL_PORT:$APP_NAME,$STAGE

  if ! lsof -i :${LOCAL_TUNNEL_PORT} >/dev/null; then
    echo -e "${red}No database connection available on port ${LOCAL_TUNNEL_PORT} - something's gone wrong! ${plain}"
    exit 1
  else
    echo -e "${green}Database tunnel opened.${plain}"
  fi
}

closeTunnels() {
  pkill -f "$TUNNEL_GREP_PATTERN"
}

getParameterValue() {
  aws ssm get-parameter --name "/$STAGE/editorial-feeds/$APP_NAME/$1" | jq -r '.Parameter.Value'
}

login() {
  echo -e "${green}Fetching database details...${plain}"
  username="$(getParameterValue 'database/username')"
  address="$(getParameterValue 'database/endpoint-address')"
  dbname="$(getParameterValue 'database/database-name')"

  echo -e "${green}Generating temporary password...${plain}"
  export PGPASSWORD="$(aws rds generate-db-auth-token --hostname $address --port $POSTGRES_PORT --username $username)"

  echo -e "${green}Attempting to log in to database...${plain}"
  psql "host=localhost port=$LOCAL_TUNNEL_PORT dbname=$dbname user=$username"

  echo -e "${green}Session complete. Closing tunnel.${plain}"
  closeTunnels

  if lsof -i :${LOCAL_TUNNEL_PORT} >/dev/null; then
    echo -e "${red}Database connection still available on port ${LOCAL_TUNNEL_PORT} - something's gone wrong! ${plain}"
    echo -e "${red}Please make sure to manually close the connection!${plain}"
    exit 1
  fi
}

main() {
  hasCredentials
  openTunnel
  login
}


echo -e "${red}Continuing to run this script will attempt to connect you directly to the $STAGE Newswires database. This is potentially dangerous, so consider discussing with the team and/or bringing a pair!${plain}"
read -p "Would you like to continue? Respond with [y]es or [n]o: " yn

case "$yn" in
  [Yy]* )
    main;;
  [Nn]* )
    echo "Exiting script now."
    exit;;
  * )
    echo -e "${red}Unclear response $yn. Exiting${plain}"
    exit;;
esac
