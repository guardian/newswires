VERSION=$(aws ssm get-parameter --name "/CODE/editorial-feeds/newswires/database/latest-migration-version" --query "Parameter.Value" --output text --region eu-west-1)
echo "Latest migration version in SSM Parameter Store: $VERSION"

files=$(ls ../db/migrations)
for f in $files; do
   version_number=$(echo $f | sed -E 's/^V([0-9]+)__.*$/\1/')
   if [ "$version_number" -gt "$VERSION" ]; then
     echo "❌ There are new migrations that have not been applied. Latest migration file is $f"
     exit 1
   fi
done
echo "✅ All migrations have been applied."
exit 0