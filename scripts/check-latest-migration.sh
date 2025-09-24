VERSION=$(aws ssm get-parameter --name "/PROD/editorial-feeds/newswires/database/last-migration-applied" --query "Parameter.Value" --output text --region eu-west-1) || {
	echo "Failed to get parameter from AWS"
	exit 1 
}

echo "Latest migration version in SSM Parameter Store: $VERSION"

FILES=$(ls db/migrations)
for file in $FILES; do
   VERSION_NUMBER=$(echo $file | sed -E 's/^V([0-9]+)__.*$/\1/')
   if [ "$VERSION_NUMBER" -gt "$VERSION" ]; then
     echo "❌ There are new migrations that have not been applied. Latest migration file is $file"
     exit 1
   fi
done
echo "✅ All migrations have been applied."
exit 0