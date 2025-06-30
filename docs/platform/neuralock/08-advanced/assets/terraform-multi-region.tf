terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "neuralock-terraform-state"
    key    = "multi-region/terraform.tfstate"
    region = "us-east-1"
    dynamodb_table = "neuralock-terraform-locks"
    encrypt = true
  }
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "threshold_config" {
  description = "Neuralock threshold configuration"
  type = object({
    k = number
    n = number
  })
  default = {
    k = 5
    n = 9
  }
}

variable "regions" {
  description = "Regional deployment configuration"
  type = map(object({
    provider      = string
    server_count  = number
    instance_type = string
    zone_ids      = list(string)
  }))
  default = {
    us-east = {
      provider      = "aws"
      server_count  = 3
      instance_type = "c5.xlarge"
      zone_ids      = ["a", "b", "c"]
    }
    us-west = {
      provider      = "aws"
      server_count  = 2
      instance_type = "c5.xlarge"
      zone_ids      = ["a", "b"]
    }
    eu-west = {
      provider      = "aws"
      server_count  = 2
      instance_type = "c5.xlarge"
      zone_ids      = ["a", "b"]
    }
    asia-pacific = {
      provider      = "aws"
      server_count  = 2
      instance_type = "c5.xlarge"
      zone_ids      = ["a", "b"]
    }
  }
}

# Locals
locals {
  common_tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Service     = "Neuralock"
  }
}

# AWS Provider Configuration for each region
provider "aws" {
  alias  = "us_east"
  region = "us-east-1"
}

provider "aws" {
  alias  = "us_west"
  region = "us-west-2"
}

provider "aws" {
  alias  = "eu_west"
  region = "eu-west-1"
}

provider "aws" {
  alias  = "ap_southeast"
  region = "ap-southeast-1"
}

# Module for each regional deployment
module "us_east_deployment" {
  source = "./modules/regional-deployment"
  
  providers = {
    aws = aws.us_east
  }
  
  region_name    = "us-east"
  server_count   = var.regions["us-east"].server_count
  instance_type  = var.regions["us-east"].instance_type
  zone_ids       = var.regions["us-east"].zone_ids
  threshold_k    = var.threshold_config.k
  threshold_n    = var.threshold_config.n
  environment    = var.environment
  tags           = local.common_tags
}

module "us_west_deployment" {
  source = "./modules/regional-deployment"
  
  providers = {
    aws = aws.us_west
  }
  
  region_name    = "us-west"
  server_count   = var.regions["us-west"].server_count
  instance_type  = var.regions["us-west"].instance_type
  zone_ids       = var.regions["us-west"].zone_ids
  threshold_k    = var.threshold_config.k
  threshold_n    = var.threshold_config.n
  environment    = var.environment
  tags           = local.common_tags
}

module "eu_west_deployment" {
  source = "./modules/regional-deployment"
  
  providers = {
    aws = aws.eu_west
  }
  
  region_name    = "eu-west"
  server_count   = var.regions["eu-west"].server_count
  instance_type  = var.regions["eu-west"].instance_type
  zone_ids       = var.regions["eu-west"].zone_ids
  threshold_k    = var.threshold_config.k
  threshold_n    = var.threshold_config.n
  environment    = var.environment
  tags           = local.common_tags
}

module "ap_southeast_deployment" {
  source = "./modules/regional-deployment"
  
  providers = {
    aws = aws.ap_southeast
  }
  
  region_name    = "asia-pacific"
  server_count   = var.regions["asia-pacific"].server_count
  instance_type  = var.regions["asia-pacific"].instance_type
  zone_ids       = var.regions["asia-pacific"].zone_ids
  threshold_k    = var.threshold_config.k
  threshold_n    = var.threshold_config.n
  environment    = var.environment
  tags           = local.common_tags
}

# Global Route53 configuration
resource "aws_route53_zone" "neuralock" {
  name = "neuralock.io"
  tags = local.common_tags
}

# Health checks for each region
resource "aws_route53_health_check" "regional" {
  for_each = var.regions
  
  fqdn              = module.us_east_deployment.load_balancer_dns
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"
  
  tags = merge(local.common_tags, {
    Region = each.key
  })
}

# Geolocation routing
resource "aws_route53_record" "regional" {
  for_each = {
    "us-east"      = { continent = "NA", alb_dns = module.us_east_deployment.load_balancer_dns }
    "us-west"      = { continent = "NA", alb_dns = module.us_west_deployment.load_balancer_dns }
    "eu-west"      = { continent = "EU", alb_dns = module.eu_west_deployment.load_balancer_dns }
    "asia-pacific" = { continent = "AS", alb_dns = module.ap_southeast_deployment.load_balancer_dns }
  }
  
  zone_id = aws_route53_zone.neuralock.zone_id
  name    = "api.neuralock.io"
  type    = "A"
  
  alias {
    name                   = each.value.alb_dns
    zone_id                = data.aws_lb.regional[each.key].zone_id
    evaluate_target_health = true
  }
  
  geolocation_routing_policy {
    continent = each.value.continent
  }
  
  set_identifier = each.key
  health_check_id = aws_route53_health_check.regional[each.key].id
}

# Default routing (fallback)
resource "aws_route53_record" "default" {
  zone_id = aws_route53_zone.neuralock.zone_id
  name    = "api.neuralock.io"
  type    = "A"
  
  alias {
    name                   = module.us_east_deployment.load_balancer_dns
    zone_id                = data.aws_lb.us_east.zone_id
    evaluate_target_health = true
  }
  
  geolocation_routing_policy {
    country = "*"
  }
  
  set_identifier = "default"
}

# Global DynamoDB table for cross-region state
resource "aws_dynamodb_table" "neuralock_state" {
  provider = aws.us_east
  
  name             = "neuralock-global-state"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "id"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  
  attribute {
    name = "id"
    type = "S"
  }
  
  replica {
    region_name = "us-west-2"
  }
  
  replica {
    region_name = "eu-west-1"
  }
  
  replica {
    region_name = "ap-southeast-1"
  }
  
  tags = local.common_tags
}

# S3 bucket for backups with cross-region replication
resource "aws_s3_bucket" "backups" {
  provider = aws.us_east
  
  bucket = "neuralock-backups-${var.environment}"
  
  tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "backups" {
  provider = aws.us_east
  
  bucket = aws_s3_bucket.backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_replication_configuration" "backups" {
  provider = aws.us_east
  
  role   = aws_iam_role.replication.arn
  bucket = aws_s3_bucket.backups.id
  
  rule {
    id     = "replicate-to-west"
    status = "Enabled"
    
    destination {
      bucket        = aws_s3_bucket.backups_replica_west.arn
      storage_class = "STANDARD_IA"
    }
  }
  
  rule {
    id     = "replicate-to-eu"
    status = "Enabled"
    
    destination {
      bucket        = aws_s3_bucket.backups_replica_eu.arn
      storage_class = "STANDARD_IA"
    }
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "neuralock_global" {
  provider = aws.us_east
  
  dashboard_name = "neuralock-global-${var.environment}"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          metrics = [
            for region in keys(var.regions) : [
              "Neuralock",
              "ServerAvailability",
              "Region",
              region
            ]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "Server Availability by Region"
        }
      },
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["Neuralock", "ThresholdHealth", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "Global Threshold Health"
          annotations = {
            horizontal = [
              {
                label = "Minimum Threshold"
                value = var.threshold_config.k
              }
            ]
          }
        }
      }
    ]
  })
}

# Outputs
output "api_endpoint" {
  description = "Global API endpoint"
  value       = "https://api.neuralock.io"
}

output "regional_endpoints" {
  description = "Regional API endpoints"
  value = {
    us_east      = module.us_east_deployment.api_endpoint
    us_west      = module.us_west_deployment.api_endpoint
    eu_west      = module.eu_west_deployment.api_endpoint
    asia_pacific = module.ap_southeast_deployment.api_endpoint
  }
}

output "health_check_ids" {
  description = "Route53 health check IDs"
  value       = { for k, v in aws_route53_health_check.regional : k => v.id }
}

output "dynamodb_table_arn" {
  description = "Global state DynamoDB table ARN"
  value       = aws_dynamodb_table.neuralock_state.arn
}

# Regional deployment module (modules/regional-deployment/main.tf)
# This would be in a separate file but included here for completeness

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.${var.region_number}.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(var.tags, {
    Name = "neuralock-${var.region_name}-vpc"
  })
}

# Subnets
resource "aws_subnet" "private" {
  count             = length(var.zone_ids)
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.${var.region_number}.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = merge(var.tags, {
    Name = "neuralock-${var.region_name}-private-${var.zone_ids[count.index]}"
    Type = "Private"
  })
}

resource "aws_subnet" "public" {
  count                   = length(var.zone_ids)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.${var.region_number}.${count.index + 101}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(var.tags, {
    Name = "neuralock-${var.region_name}-public-${var.zone_ids[count.index]}"
    Type = "Public"
  })
}

# Security Group
resource "aws_security_group" "neuralock" {
  name_prefix = "neuralock-${var.region_name}-"
  description = "Security group for Neuralock servers"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
    description = "API access from VPC"
  }
  
  ingress {
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
    description = "Metrics access from VPC"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }
  
  tags = var.tags
}

# Launch Template
resource "aws_launch_template" "neuralock" {
  name_prefix   = "neuralock-${var.region_name}-"
  image_id      = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  
  vpc_security_group_ids = [aws_security_group.neuralock.id]
  
  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    region_name = var.region_name
    threshold_k = var.threshold_k
    threshold_n = var.threshold_n
  }))
  
  block_device_mappings {
    device_name = "/dev/sda1"
    
    ebs {
      volume_size           = 100
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }
  
  tag_specifications {
    resource_type = "instance"
    tags = merge(var.tags, {
      Name = "neuralock-${var.region_name}-server"
    })
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "neuralock" {
  name_prefix         = "neuralock-${var.region_name}-"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.neuralock.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300
  min_size            = var.server_count
  max_size            = var.server_count * 2
  desired_capacity    = var.server_count
  
  launch_template {
    id      = aws_launch_template.neuralock.id
    version = "$Latest"
  }
  
  tag {
    key                 = "Name"
    value               = "neuralock-${var.region_name}"
    propagate_at_launch = true
  }
  
  dynamic "tag" {
    for_each = var.tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}