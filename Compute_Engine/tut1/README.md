# Deploying a web application on GCE

In this tutorial you will deploy a sample application, the "Fancy Store" ecommerce website, to show how a website can be deployed and scaled easily with Compute Engine.

NOTE: For this lab, all the instructions written down below are executed from `gcloud shell`.

Run the following commands to setup the default zone and region for the dev env:

`gcloud config set compute/zone "ZONE" `

`export ZONE=$(gcloud config get compute/zone)`

`gcloud config set compute/region "REGION" `

`export REGION=$(gcloud config get compute/region)`


The following API has to be enabled in order to use GCE

`gcloud services enable compute.googleapis.com`

You will use a Cloud Storage bucket to house your built code as well as your startup scripts.

From Cloud Shell, execute the following to create a new Cloud Storage bucket:

`gsutil mb gs://fancy-store-$DEVSHELL_PROJECT_ID`

Use the existing Fancy Store ecommerce website based on the `monolith-to-microservices` repository as the basis for your website.

`git clone https://github.com/googlecodelabs/monolith-to-microservices.git`

cd into the directory and run `./setup.sh`

to setup the application run.

Once completed, ensure Cloud Shell is running a compatible nodeJS version with the following command:

```
nvm install --lts
```


In the following steps you will:

1. Create a startup script to configure instances.
2. Clone source code and upload to Cloud Storage.
3. Deploy a Compute Engine instance to host the backend microservices.
4. Reconfigure the frontend code to utilize the backend microservices instance.
5. Deploy a Compute Engine instance to host the frontend microservice.
6. Configure the network to allow communication.

Now for the startup-script, copy the script (from this folder) and paste it into a startup-script.sh file inside the monolith-to-microservices folder.

The startup script performs the following tasks:

* Installs the Logging agent. The agent automatically collects logs from syslog.
* Installs Node.js and Supervisor. Supervisor runs the app as a daemon.
* Clones the app's source code from Cloud Storage Bucket and installs dependencies.
* Configures Supervisor to run the app. Supervisor makes sure the app is restarted if it exits unexpectedly or is stopped by an admin or process. It also sends the app's stdout and stderr to syslog for the Logging agent to collect.

Find the text `[DEVSHELL_PROJECT_ID]` in the file and replace it with your Project ID: `qwiklabs-gcp-00-f8d10be38b91`

Run the following command: 

`sed -i s/[DEVSHELL_PROJECT_ID]/qwiklabs-gcp-00-f8d10be38b91/g startup-script.sh`

Now we will copy the created script into our storage bucket

`gsutil cp ~/monolith-to-microservices/startup-script.sh gs://fancy-store-$DEVSHELL_PROJECT_ID`

And now we will copy the code of this application to our storage bucket

`cd ~ `

`rm -rf monolith-to-microservices/*/node_modules`

`gsutil -m cp -r monolith-to-microservices gs://fancy-store-$DEVSHELL_PROJECT_ID/`

Now create the Compute Engine instance which will host the application, so we will have to provide the path to the startup-script.sh which we created in previous steps as the --metadata-startup-script

gcloud compute instances create backend
    --zone=$ZONE
    --machine-type=e2-standard-2
    --tags=backend
   --metadata=startup-script-url=https://storage.googleapis.com/fancy-store-$DEVSHELL_PROJECT_ID/startup-script.sh

Configure a connection to the backend

Before you deploy the frontend of the application, you need to update the configuration to point to the backend you just deployed.

Retrieve the external IP address of the backend with the following command, look under the EXTERNAL_IP tab for the backend instance:

`gcloud compute instances list`

From the above command, copy the External IP of the instance and then go inside the application -> react-app -> env.yaml

Change the localhost with the external IP here.

now build the frontend of the application by running:

cd ~/monolith-to-microservices/react-app
npm install && npm run-script build

Output of above command: 

Deleting stale folder: ../microservices/src/frontend/public
Deleted stale destination folder: ../microservices/src/frontend/public
Copying files from ./build to ../microservices/src/frontend/public
Copied ./build to ../microservices/src/frontend/public successfully!

Now copy this code to the google storage bucket

cd ~
rm -rf monolith-to-microservices/*/node_modules
gsutil -m cp -r monolith-to-microservices gs://fancy-store-$DEVSHELL_PROJECT_ID/

Now that the code is configured, deploy the frontend instance.

Execute the following to deploy the frontend instance with a similar command as before. This instance is tagged as frontend for firewall purposes:

gcloud compute instances create frontend
    --zone=$ZONE
    --machine-type=e2-standard-2
    --tags=frontend
    --metadata=startup-script-url=https://storage.googleapis.com/fancy-store-$DEVSHELL_PROJECT_ID/startup-script.sh


Note that this is the compute instance which wil host the 'frontend' of the application and the previous instance which we deployed is hosting the 'backend' of the application. See the tags in both the commands.

**Accessing the application**

Create firewall rules to allow access to port 8080 for the frontend, and ports 8081-8082 for the backend. These firewall commands use the tags assigned during instance creation for application:


gcloud compute firewall-rules create fw-fe
    --allow tcp:8080
    --target-tags=frontend

gcloud compute firewall-rules create fw-be
    --allow tcp:8081-8082
    --target-tags=backend


In order to navigate to the external IP of the frontend, you need to know the address. Run the following and look for the EXTERNAL_IP of the frontend instance:

`gcloud compute instances list`


student_04_5a72cb002dfc@cloudshell:~ (qwiklabs-gcp-00-f8d10be38b91)$ `gcloud compute instances list`
NAME: backend
ZONE: us-west1-b
MACHINE_TYPE: e2-standard-2
PREEMPTIBLE:
INTERNAL_IP: 10.138.0.2
`EXTERNAL_IP: 35.185.241.241`
STATUS: RUNNING

NAME: frontend
ZONE: us-west1-b
MACHINE_TYPE: e2-standard-2
PREEMPTIBLE:
INTERNAL_IP: 10.138.0.3
`EXTERNAL_IP: 34.19.75.118`
STATUS: RUNNING


Application should now be accessible at the external_ip address of the above compute instance.


## How to manage the application at scale

To allow the application to scale, managed instance groups will be created and will use the frontend and backend instances as Instance Templates.

A managed instance group (MIG) contains identical instances that you can manage as a single entity in a single zone. Managed instance groups maintain high availability of your apps by proactively keeping your instances available, that is, in the RUNNING state. You will be using managed instance groups for your frontend and backend instances to provide autohealing, load balancing, autoscaling, and rolling updates.

Instance templates allow you to define the machine type, boot disk image or container image, network, and other instance properties to use when creating new VM instances. You can use instance templates to create instances in a managed instance group or even to create individual instances.

To improve the availability of the application itself and to verify it is responding, configure an autohealing policy for the managed instance groups.

An autohealing policy relies on an application-based health check to verify that an app is responding as expected. Checking that an app responds is more precise than simply verifying that an instance is in a RUNNING state, which is the default behavior.

To complement your managed instance groups, use HTTP(S) Load Balancers to serve traffic to the frontend and backend microservices, and use mappings to send traffic to the proper backend services based on pathing rules. This exposes a single load balanced IP for all services.

**Create HTTP(S) load balancer**

Google Cloud offers many different types of load balancers. For this lab you use an HTTP(S) Load Balancer for your traffic. An HTTP load balancer is structured as follows:

- A forwarding rule directs incoming requests to a target HTTP proxy.

- The target HTTP proxy checks each request against a URL map to determine the appropriate backend service for the request.

- The backend service directs each request to an appropriate backend based on serving capacity, zone, and instance health of its attached backends. The health of each backend instance is verified using an HTTP health check. If the backend service is configured to use an HTTPS or HTTP/2 health check, the request will be encrypted on its way to the backend instance.
- Sessions between the load balancer and the instance can use the HTTP, HTTPS, or HTTP/2 protocol. If you use HTTPS or HTTP/2, each instance in the backend services must have an SSL certificate.

MIGs allow rolling-update feature, so in case you make any changes in your application code (viz. if you change the external IP of the application), then the application can be restarted using

gcloud compute instance-groups managed rolling-action replace fancy-fe-mig
    --zone=$ZONE
    --max-unavailable 100%


Hands-on: Load balancers: https://www.cloudskillsboost.google/course_templates/641/labs/464867
