# Create and Manage Cloud Resources: Challenge Lab Solution
Lab-Link: [Here](https://www.cloudskillsboost.google/paths/11/course_templates/648/labs/484536)

*Note: You dont have to use any stupid script to complete this lab.


## Task 1:

Create a project jumphost instance

### Requirements:
Name the instance nucleus-jumphost-512. <br>
Create the instance in the us-east1-c zone. <br>
Use an e2-micro machine type. <br>
Use the default image type (Debian Linux).

This can be simply done from Google Cloud console

## Task 2: 

### Requirements:

- Create an instance template. Don't use the default machine type. Make sure you specify e2-medium as the machine type.
- Create a managed instance group based on the template.
- Create a firewall rule named as accept-tcp-rule-457 to allow traffic (80/tcp).
- Create a health check.
- Create a backend service and add your instance group as the backend to the backend service group with named port (http:80).
- Create a URL map, and target the HTTP proxy to route the incoming requests to the default backend service.
- Create a target HTTP proxy to route requests to your URL map
- Create a forwarding rule.

**Step-by-Step solution**

<font color="red">Before moving on, please change the Region/Zone based on the lab environment you are given. </font>

Step 1:
Create an instance template. Don't use the default machine type. Make sure you specify e2-medium as the machine type.

<br>

First copy the startup script in your cloud shell and save it as is.

![alt text](image.png)

Then create the instance template using following command:

```bash
gcloud compute instance-templates create nucleus-template --region=us-east1 --network=default --metadata-from-file startup-script=startup.sh --machine-type=e2-micro
```

Step 2:

Creating MIG

```bash
gcloud compute instance-groups managed create nucleus-group --template=nucleus-template --size=2 --region=us-east1
```
Now you will see total 3 instances in your project.

Step 3: 

Creating firewall rule named as...

```bash
gcloud compute firewall-rules create accept-tcp-rule-457 --allow tcp:80
```

Step 4: 

Creating health-checks

```bash
gcloud compute http-health-checks create http-basic-check
```

Step 5:

Create a backend service and add the instance group as the backend to the backend service group with named port (http:80)

```bash
gcloud compute instance-groups managed set-named-ports nucleus-group --named-ports http:80 --region us-east1
```
What is a backend-service?

A backend service defines how Cloud Load Balancing distributes traffic. The backend service configuration contains a set of values, such as the protocol used to connect to backends, various distribution and session settings, health checks, and timeouts. These settings provide fine-grained control over how your load balancer behaves. To get you started, most of the settings have default values that allow for fast configuration. A backend service is either global or regional in scope.

What is named-ports?
The backend service's named port attribute is only applicable to proxy load balancers using instance group backends. The named port defines the destination port used for the TCP connection between the proxy (GFE or Envoy) and the backend instance.

```bash
gcloud compute backend-services create web-server-backend \
          --protocol HTTP \
          --http-health-checks http-basic-check \
          --global
```

```bash
gcloud compute backend-services add-backend web-server-backend \
 --instance-group nucleus-group \ 
 --instance-group-region us-east1 \ 
 --global
```

Step 6:
<br>Create a URL map, and target the HTTP proxy to route the incoming requests to the default backend service.

```bash
gcloud compute url-maps create web-server-map \
          --default-service web-server-backend
```

Step 7:
Create a target HTTP proxy to route requests to your URL map

```bash
gcloud compute target-http-proxies create http-lb-proxy \
          --url-map web-server-map
```

Step 8: Create a forwarding rule
```bash
gcloud compute forwarding-rules create http-content-rule \
        --global \
        --target-http-proxy http-lb-proxy \
        --ports 80
```

```bash
gcloud compute forwarding-rules list
```

<br>
Wait for 5-7 minutes and then note down the external IP of the load-balancer.

<br>
Go to your browser and use the IP copied to make an HTTP request on that.

<br>
Do that a couple times and see if the ngnix server is changing the instance name on the page after couple refreshes on the same URL.

<br>
If it does that, then it means load balancing is happening behind the scenes.

<br>
<br>

<font color="green">**LAB COMPLETE** </font>
