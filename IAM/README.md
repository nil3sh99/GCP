# What is IAM

Google Cloud offers Cloud Identity and Access Management (IAM), which lets you manage access control by defining who (identity) has what access (role) for which resource.

In IAM, permission to access a resource isn't granted directly to the end user. Instead, permissions are grouped into roles, and roles are granted to authenticated principals. (In the past, IAM often referred to principals as members. Some APIs still use this term.)

Accesses are given to principals and principals can be of the following types:

* Google Account
* Service account
* Google group
* Google Workspace account
* Cloud Identity domain
* All authenticated users
* All users

The most common ones that you will see in enterprise grade environments are:

- Federated Google Accounts tied within a group
- All users
- Service Account

## What is a role

A role is a collection of permissions. You cannot assign a permission to the user directly; instead you grant them a role. When you grant a role to a user, you grant them all the permissions that the role contains.

### gcloud

This section entails different gcloud commands that can be used to setup the default zone, region etc.

If you do not specify a zone/region while creating a VM instance then the gcloud command picks up the default zones from the configuration file.

To setup your configs for zones/region, run the following command:

gcloud config set compute/zone `<zone-name>`

gcloud config set compute/region `<region-name>`

To get the defaults configuration, run the following command:

cat ~/.config/gcloud/configurations/config_default

###### How to switch between multiple IAM configs?

gcloud init --no-launch-browser

2. Select option 2,  *Create a new configuration* .
3. *configuration name* : Type  **user2** .
4. *Log in with a new account* : select option 3 - you're logging in with the other provided user name.
5. Press ENTER when you see the prompt *Do you want to continue (Y/n)?*
6. Navigate to the link displayed in a new tab.
7. Click *Use another account*
8. Copy the second user account (`<email account of the second user>`), and paste into the *email or phone* prompt.

Once this is done, it will ask you to select a default project, select that and then a new configuration will be created for user2.

[student-01-4572aca29b6d@centos-clean ~]$ gcloud config list
[compute]
region = us-east1
zone = us-east1-b
[core]
account = student-01-72f6e2f60d93@qwiklabs.net
disable_usage_reporting = True
project = qwiklabs-gcp-00-2a19ce974cbc

Your active configuration is: [`user2`]

`<gcloud config configurations list>`

default  False      student-01-4572aca29b6d@qwiklabs.net                                us-east1-c            us-east1
user2    True       student-01-72f6e2f60d93@qwiklabs.net  qwiklabs-gcp-00-2a19ce974cbc  us-east1-b            us-east1

To change from the user2 to default configuration, run the following command

`gcloud config configurations activate `


###### How to assign the roles to other users

Before assigning a particular role (custom/pre-defined) to a user, we should examine the permissions that role has on it.

`gcloud iam roles describe roles/compute.instanceAdmin`

You can see **roles/compute.instanceAdmin** has many permissions, but these are the minimum needed for later:

* compute.instances.create
* compute.instances.delete
* compute.instances.start
* compute.instances.stop
* compute.instances.update
* compute.disks.create
* compute.subnetworks.use
* compute.subnetworks.useExternalIp
* compute.instances.setMetadata
* compute.instances.setServiceAccount


Now that you know that roles contain permissions, how do you assign a role (and therefore all the associated permissions), to a user account?

There are two ways to attach a role:

* To the user and an organization
* To a user and a project



`gcloud projects add-iam-policy-binding qwiklabs-gcp-01-256a3c7662e3 --member user:$USERID2 --role=roles/viewer`


Now this command will give the user2 access to the project 2, but it's a viewer role only, so the user2 will be able to list the instances, and get other resources only. The creation permission is not yet allowed on it.

How can we enable the creation permission?

We create a custom role and let's call it devops that has permissions to create an instance.


`gcloud iam roles create devops --project $PROJECTID2 --permissions "compute.instances.create,compute.instances.delete,compute.instances.start,compute.instances.stop,compute.instances.update,compute.disks.create,compute.subnetworks.use,compute.subnetworks.useExternalIp,compute.instances.setMetadata,compute.instances.setServiceAccount"`
Created role [devops].
etag: BwYdx6hAd2c=
includedPermissions:

- compute.disks.create
- compute.instances.create
- compute.instances.delete
- compute.instances.setMetadata
- compute.instances.setServiceAccount
- compute.instances.start
- compute.instances.stop
- compute.instances.update
- compute.subnetworks.use
- compute.subnetworks.useExternalIp
  name: projects/qwiklabs-gcp-01-256a3c7662e3/roles/devops
  stage: ALPHA
  title: devops

Bind the role to the second account to both projects

`gcloud projects add-iam-policy-binding $PROJECTID2 --member user:$USERID2 --role=projects/$PROJECTID2/roles/devops`

Updated IAM policy for project [qwiklabs-gcp-01-256a3c7662e3].

bindings:

- members:

  - user:student-01-72f6e2f60d93@qwiklabs.net

  role: projects/qwiklabs-gcp-01-256a3c7662e3/roles/devops

- members:

  - serviceAccount:1034055709621-compute@developer.gserviceaccount.com

  - serviceAccount:1034055709621@cloudservices.gserviceaccount.com

  role: roles/editor

...(and more bindings)

version: 1

What are two of the three items you need to provide when binding an IAM role to a project?

- role
- projectID
- userID/account

###### What is a service account

A service account is a special Google account that belongs to your application or a virtual machine (VM) instead of to an individual end user. Your application uses the service account to call the Google API of a service so that the users aren't directly involved.

How to create a SA

`gcloud config configurations activate default`

`gcloud iam service-accounts create devops --display-name devops`

And how to bind a particular role to this SA?

`gcloud projects add-iam-policy-binding $PROJECTID2 --member serviceAccount:$SA --role=roles/iam.serviceAccountUser`


And if you want to create a compute instance attached with this service account, then execute the following command

`gcloud compute instances create lab-3 --zone europe-west4-c --machine-type=e2-standard-2 --service-account $SA --scopes "https://www.googleapis.com/auth/compute"`

**What are access scopes?**

Access scopes are the legacy method of specifying permissions for your instance. Access scopes are not a security mechanism. Instead, they define the default OAuth scopes used in requests from the `gcloud` tool or the client libraries. They have no effect when making requests not authenticated through OAuth, such as gRPC or the SignBlob APIs.

You must set up access scopes when you configure an instance to run as a service account.

A best practice is to set the full cloud-platform access scope on the instance, then securely limit the service account's API access with IAM roles.

Access scopes apply on a per-instance basis. You set access scopes when creating an instance and the access scopes persist only for the life of the instance.

Access scopes have no effect if you have not enabled the related API on the project that the service account belongs to. For example, granting an access scope for Cloud Storage on a virtual machine instance allows the instance to call the Cloud Storage API only if you have enabled the Cloud Storage API on the project.
