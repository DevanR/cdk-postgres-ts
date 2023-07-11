import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";

export class DatabaseStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string) {
    super(scope, id);

    const vpc = new ec2.Vpc(this, "PostgresVPC", {
      cidr: "10.0.0.0/16",
      maxAzs: 3,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "private-subnet-1",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    const dbSG = new ec2.SecurityGroup(this, "PostgresSG", {
      vpc: vpc,
      allowAllOutbound: true,
      description: "security group for the database server",
    });

    dbSG.addIngressRule(
        ec2.Peer.ipv4(vpc.vpcCidrBlock),
        ec2.Port.tcp(5432),
        "allow PostgreSQL access from within VPC"
    );

    new rds.DatabaseInstance(this, "PostgresDB", {
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [dbSG],
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_3,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      credentials: rds.Credentials.fromGeneratedSecret("root"),
      backupRetention: cdk.Duration.days(30),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      deletionProtection: true,
      publiclyAccessible: false,
    });
  }
}
