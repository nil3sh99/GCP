# Challenge objectives


* Create a development VPC with three subnets manually
* Create a production VPC with three subnets manually
* Create a bastion that is connected to both VPCs
* Create a development Cloud SQL Instance and connect and prepare the WordPress environment
* Create a Kubernetes cluster in the development VPC for WordPress
* Prepare the Kubernetes cluster for the WordPress environment
* Create a WordPress deployment using the supplied configuration
* Enable monitoring of the cluster
* Provide access for an additional engineer

![Google Cloud environment, Team Griffin Infrastructure diagram](https://cdn.qwiklabs.com/UE5MydlafU0QvN7zdaOLo%2BVxvETvmuPJh%2B9kZxQnOzE%3D)

## Steps

Task 1 and 2:

Create a development VPC with 2 subnets manually

Simply go to VPC service and create a custom VPC with three subnets.

Do the same for production VPC.

This will cover the creation of VMs, but we need to have firewall rules as well created for these VPCs.

Go to firewall rules and create a firewall rule targeting all instances within the network.

Give the target ranges as the subnet CIDRs for prod.

and then create a new firewall rule in dev vpc, give the subnet CIDRs for dev.

BUT this did not resolve the SSH login issue, so create firewall tags as well and for the filter ranges, set it from anywhere (0.0.0.0/0).


Task 3. Create a bastion host

Make sure that you are creating only one VM but it should have 2 network interfaces.

One pointing to dev-mgmt vpc and other to prod-mgmt vpc.


Task 4: Create and Configure Cloud SQL instance

While creating the SQL instance, make sure the preset is selected as "development".

I did not set any password for my db as this is only a test lab.

Now go to Compute Engine -> VM instances -> SSH into the bastion host VM that you created in previous step.

(NOTE: If you select your VM for ssh into MySQL DB instance, then you would first have to install mysql on that VM)

For the following instructions, I am using gcloud shell, because we just have to create database, so doesn't matter if I do it via our custom VM or gcloud shell. 

Run the following commands: 

export PROJECT_ID=$(gcloud config get-value project)
gcloud config set project $PROJECT_ID

To connect to Cloud SQL db instance:

gcloud sql connect griffin-dev-db --user=root --quiet

Task 5: 

Create GKE cluster

gcloud container clusters create griffin-dev --num-nodes=2 \\

--machine-type=e2-standard-4 \\

--network=griffin-dev-vpc \

 --subnetwork=griffin-dev-wp --zone=us-east1-c


Task 6: 

Follow the instructions and copy the files to your cloud shell.

gsutil -m cp -r gs://cloud-training/gsp321/wp-k8s .

edit the wp-env.yaml file now, with the given username and password.

and then create the deployment using

kubectl create -f wp-env.yaml


Task 7: Create a WordPress deployment

Edit the wp-deployment.yaml file and replace **YOUR_SQL_INSTANCE** with the griffin-dev-db's instance connection name

to get the connection name, run this command:

gcloud sql instances describe griffin-dev-db --format="value(connectionName)"

and then use the stream editor to edit the file deployment file

sed -i s/YOUR_SQL_INSTANCE/"your value from the last commend"/g wp-deployment.yaml

after this is done, create the deployment and service using:

kubectl create -f wp-deployment.yaml

kubectl create -f wp-service.yaml

Now this service will be deployed on a load balancer.


Task 8: Create an uptime check

This is a tricky one, because if you go and create an uptime check and select GKE there, it won't pass the stage.

For this, go to your GKE and basically copy the endpoint URL for your deployment.

Now, create the uptime check using the URL option and copy this external IP there (without port).

Leave the rest to default and create the uptime check.

It will pass the stage now.


Task 9: Go to IAM and select the second IAM principal from the list. Give him the editor roleset and click save.


Congratulations!!
