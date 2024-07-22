# Orchestrating the cloud with kubernetes

For this lab, using a managed environment such as Kubernetes Engine allows you to focus on experiencing Kubernetes rather than setting up the underlying infrastructure. Kubernetes Engine is a managed environment for deploying containerized applications. It brings the latest innovations in developer productivity, resource efficiency, automated operations, and open source flexibility to accelerate your time to market.

Lab link: https://www.cloudskillsboost.google/course_templates/641/labs/464868

In this lab you will learn how to:

* Provision a complete [Kubernetes](http://kubernetes.io/) cluster using [Kubernetes Engine](https://cloud.google.com/container-engine).
* Deploy and manage Docker containers using `kubectl`.
* Break an application into microservices using Kubernetes' Deployments and Services.

To work with k8s, we need to setup the clustes first.

`gcloud container clusters create io --zone us-east1-c`

The easiest way to get started with Kubernetes is to use the `kubectl create` command.

`kubectl create deployment nginx --image=nginx:1.10.0`


```
kubectl expose deployment nginx --port 80 --type LoadBalancer
```

Using the above command, kubernetes created an external Load Balancer with a public IP address attached to it. Any client who hits that public IP address will be routed to the pods behind the service. In this case that would be the nginx pod.


Core of k8s is Pod. Pod is basically a collection of one or more containers. 


Pods also have [Volumes](https://kubernetes.io/docs/concepts/storage/volumes/). Volumes are data disks that live as long as the pods live, and can be used by the containers in that pod. Pods provide a shared namespace for their contents which means that the two containers inside of our example pod can communicate with each other, and they also share the attached volumes.

Pods also share a network namespace. This means that there is one IP Address per pod.

Pods can be created using pod configuration files.

Example of a pod file:

student_04_5a72cb002dfc@cloudshell:~/orchestrate-with-kubernetes/kubernetes (qwiklabs-gcp-03-e2122a8dc55a)$ cat pods/monolith.yaml


apiVersion: v1
kind: Pod
metadata:
  name: monolith
  labels:
    app: monolith
spec:
  containers:
    - name: monolith
      image: kelseyhightower/monolith:1.0.0
      args:
        - "-http=0.0.0.0:80"
        - "-health=0.0.0.0:81"
        - "-secret=secret"
      ports:
        - name: http
          containerPort: 80
        - name: health
          containerPort: 81
      resources:
        limits:
          cpu: 0.2
          memory: "10Mi"


And to create the deployment to manage this pod, the simple command to run is:

```
kubectl create -f pods/monolith.yaml
```

To get the list of pods

`kubectl get pods`

And to describe the configuration of a specific pod

`kubectl describe pods monolith`

By default, pods are allocated a private IP address and cannot be reached outside of the cluster. Use the `kubectl port-forward` command to map a local port to a port inside the monolith pod.

`kubectl port-forward monolith 10080:80`

It exposes the monolith application to listen at port 10080:80, so if you do a curl command like this:

`curl http://127.0.0.1:10080`

then the application will respond back.


to check the logs from the running pod, run the following command:

`kubectl logs monolith`

Example output:
2024/07/22 05:39:26 Starting server...
2024/07/22 05:39:26 Health service listening on 0.0.0.0:81
2024/07/22 05:39:26 HTTP service listening on 0.0.0.0:80
127.0.0.1:58450 - - [Mon, 22 Jul 2024 05:42:57 UTC] "GET / HTTP/1.1" curl/7.81.0
127.0.0.1:56476 - - [Mon, 22 Jul 2024 05:43:13 UTC] "GET /secure HTTP/1.1" curl/7.81.0
127.0.0.1:37368 - - [Mon, 22 Jul 2024 05:43:35 UTC] "GET /login HTTP/1.1" curl/7.81.0
127.0.0.1:54892 - - [Mon, 22 Jul 2024 05:43:53 UTC] "GET /login HTTP/1.1" curl/7.81.0
127.0.0.1:42068 - - [Mon, 22 Jul 2024 05:44:05 UTC] "GET /secure HTTP/1.1" curl/7.81.0


To troubleshoot from within a container, run the following command:

`kubectl exec monolith --stdin --tty -c monolith -- /bin/sh`


## Services

Pods aren't meant to be persistent. They can be stopped or started for many reasons - like failed liveness or readiness checks - and this leads to a problem:

What happens if you want to communicate with a set of Pods? When they get restarted they might have a different IP address.

That's where [Services](https://kubernetes.io/docs/concepts/services-networking/service/) come in. Services provide stable endpoints for Pods.

Services use labels to determine what Pods they operate on. If Pods have the correct labels, they are automatically picked up and exposed by our services.

The level of access a service provides to a set of pods depends on the Service's type. Currently there are three types:

* `ClusterIP` (internal) -- the default type means that this Service is only visible inside of the cluster,
* `NodePort` gives each node in the cluster an externally accessible IP and
* `LoadBalancer` adds a load balancer from the cloud provider which forwards traffic from the service to Nodes within it.

Use the `kubectl label` command to add the missing `secure=enabled` label to the secure-monolith Pod. Afterwards, you can check and see that your labels have been updated

`kubectl get pods -l "app=monolith,secure=enabled"`

    No resources found in default namespace.

`kubectl label pods secure-monolith 'secure=enabled'`

`kubectl get pods secure-monolith --show-labels`

NAME              READY   STATUS    RESTARTS   AGE     LABELS
secure-monolith   2/2     Running   0          4m27s   app=monolith,secure=enabled


## Deployments

The goal of this lab is to get you ready for scaling and managing containers in production. That's where [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#what-is-a-deployment) come in. Deployments are a declarative way to ensure that the number of Pods running is equal to the desired number of Pods, specified by the user.

For a micro-service architecture, the deployments are created for every service in the application. Example, if the application has three components:

- auth
- hello
- frontend

Then, we create deployments one for each service. 

To create the deployments, it is the same old command

kubectl create -f deployments/frontend.yaml

kubectl create -f services/frontend.yaml

kubectl create configmap


To get the list of all the services that you have deployed: 

kubectl get services
NAME         TYPE           CLUSTER-IP       EXTERNAL-IP       PORT(S)         AGE
auth         ClusterIP      34.118.237.79    `<none>`            80/TCP          80s
frontend     LoadBalancer   34.118.234.48    `<pending>`         443:30454/TCP   18s
hello        ClusterIP      34.118.238.90    `<none>`            80/TCP          59s
kubernetes   ClusterIP      34.118.224.1     `<none>`            443/TCP         31m
monolith     NodePort       34.118.230.238   `<none>`            443:31000/TCP   10m
nginx        LoadBalancer   34.118.225.125   104.196.101.253   80:31842/TCP    28m
