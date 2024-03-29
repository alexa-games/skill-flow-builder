# AWS CloudFormation Templates

When building or deploying a story for the first time using the `cfn` deployer,
the CLI will generate a `skill-stack.yaml` file and place it in the `metadata/`
directory. This file contains a default CloudFormation template with the
following resources:

1. **Lambda function:** This is the backend for your skill and is required
for it to function. The build output of your `code/` directory will be copied
here.
2. **Log group:** Log output for your Lambda function.
3. **DynamoDB table:** The session storage for your skill. If you don't
provision one during deployment, SFB will create one the first time
your skill runs as it is required functionality, so including it in
your CloudFormation template means you can skip the "warming" step
and adjust the configuration of your table during deployment.
4. **S3 bucket:** Storage for static resources and the Polly cache. See
[Set up Amazon Polly voices](./setup-polly-voices.md) for more information.

## Modifying the template

You can modify the `skill-stack.yaml` file to suit your project's needs.
While the above resources are required for SFB to function, you can add
more resources or adjust these resources' settings to fine-tune your skill's
infrastructure.

For example, the DynamoDB table starts with the following configurations:

```yaml
# Remember to scale up the capacity as your customer size grows!
ProvisionedThroughput:
  ReadCapacityUnits: '5'
  WriteCapacityUnits: '5'
PointInTimeRecoverySpecification: # Automatic backups for any point in time
  PointInTimeRecoveryEnabled: true
```

As your skill becomes more popular, you may need to increase the provisioned
throughput to keep up with requests to your skill. For more information on these configurations, see:
- [Read/Write Capacity Mode](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadWriteCapacityMode.html)
- [Point-In-Time Recovery](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/PointInTimeRecovery.html)

### Enabling Access Logging

To further monitor your S3 buckets, we recommend turning on server access logging. This will provide you with detailed records of all the requests made to a specified S3 bucket. For more information on what this is, see [S3 server access logging](https://docs.aws.amazon.com/AmazonS3/latest/userguide/enable-server-access-logging.html).

To enable this feature, you can attach something like the below to the `skill-stack.yaml` configuration.

```yaml
AccessLogsBucket # Create a separate bucket to log requests
  Type: AWS::S3::Bucket
  DeletionPolicy: Retain
  Properties:
    BucketName: SFB-STORY-ID-access-logs-bucket # This should be edited to whatever bucket name is appropriate
    AccessControl: LogDeliveryWrite
    BucketEncryption:
      ServerSideEncryptionConfiguration:
        - ServerSideEncryptionByDefault:
            SSEAlgorithm: AES256
AccessLogsBucketPolicy # Create a policy for the new bucket to enforce HTTPS
  Type: AWS::S3::BucketPolicy
  Properties:
    Bucket:
      Ref: AccessLogsBucket
    PolicyDocument:
      Statement:
      - Effect: Deny
        Principal: '*'
        Action: s3:*
        Resource:
          Fn::Sub: 'arn:aws:s3:::${AccessLogsBucket}'
        Condition: { Bool: { 'aws:SecureTransport': false } }
      - Effect: Deny
        Principal: '*'
        Action: s3:*
        Resource:
          Fn::Sub: 'arn:aws:s3:::${AccessLogsBucket}/*'
        Condition: { Bool: { 'aws:SecureTransport': false } }
...
AlexaSkillBucket # Edit the existing AlexaSkillBucket's properties
...
  LoggingConfiguration:
    DestinationBucketName:
      Ref: AccessLogsBucket
    LogFilePrefix: access-logs-
```

*Please note: This will increase the S3 usage costs associated with the related AWS account.*

## Deploying to multiple stages and locales

A separate `skill-stack.yaml` will be generated for each stage+locale
combination that you build and deploy. Each copy of `skill-stack.yaml`
will be placed in its respective `metadata/<stage+locale>/` folder.
You can adjust each stage+locale combination separately, and even
share resources if desired by updating the associated settings (for example,
`"dynamo-db-session-table-name"` and `"s3-bucket-name"`) in the `abcConfig.json`
overrides.

```json
"alpha-en-us": {
  "ask-skill-directory-name": "my-great-skill-alpha-en-us",
  "story-id": "my-great-skill-alpha-en-us",
  "dynamo-db-session-table-name": "my-great-skill-alpha-sessions",
  "s3-bucket-name": "my-great-skill-alpha-bucket"
},
"alpha-en-gb": {
  "ask-skill-directory-name": "my-great-skill-alpha-en-gb",
  "story-id": "my-great-skill-alpha-en-gb",
  "dynamo-db-session-table-name": "my-great-skill-alpha-sessions",
  "s3-bucket-name": "my-great-skill-alpha-bucket"
}
```

## Additional Resources

For more information on AWS CloudFormation, see [AWS CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/index.html).
