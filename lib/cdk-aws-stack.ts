import {Stack, StackProps, aws_ecs_patterns, Duration, CfnOutput} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
const path = require('path')


export class CdkAwsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

// Create a cluster
    const vpc = new ec2.Vpc(this, 'Vpc');

    const cluster = new ecs.Cluster(this, 'EcsCluster', { vpc });
    cluster.addCapacity('DefaultAutoScalingGroup', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO)
    });

// Create Task Definition with placement constraint
    const taskDefinition = new ecs.Ec2TaskDefinition(this, 'TaskDef')

    const container = taskDefinition.addContainer('backend', {

     image: ecs.ContainerImage.fromAsset(path.resolve(__dirname, 'backend')),
     // image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      memoryLimitMiB: 256,
    });

    container.addPortMappings({
      containerPort: 3000,
      hostPort: 8080,
      protocol: ecs.Protocol.TCP,
    });

    const service = new ecs.Ec2Service(this, 'Service', {
      cluster,
      taskDefinition,
    });

    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true
    })

    const listener = lb.addListener('PublicListener', {port: 80, open: true})

    listener.addTargets('ECS', {
      port: 80,
      targets: [service.loadBalancerTarget({
        containerName: 'backend',
        containerPort: 3000
      })],
      // include health check (default is none)
      healthCheck: {
        interval: Duration.seconds(60),
        path: "/health",
        timeout: Duration.seconds(5),
      }
    });
    new CfnOutput(this, 'LoadBalancerDNS', { value: lb.loadBalancerDnsName, });
  }
}
