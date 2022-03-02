# Deploying to GCP (GKE API)

## GKE Deployment

### Clone latest repo (renew personal access token if needed)
```
git clone https://katzemeo@github.com/katzemeo/katzemeo.git
curl -u username:token https://api.github.com/user
cd katzemeo
```

### Confirm current project is correct and setup your repo if needed
```
gcloud config get-value project
gcloud config set project my-project
```

### First time only, setup my-repo private image registry
```
gcloud artifacts repositories create my-repo --repository-format=docker \
    --location=us-east4 --description="Docker repository"
gcloud artifacts repositories list
```

### Build and tag docker image to registry
```
gcloud builds submit --tag us-east4-docker.pkg.dev/my-project/my-repo/katzemeo:latest ./gcp/Dockerfile
OR
gcloud builds submit
```

### Confirm login (if needed) and set context for kubectl access
```
kubectl config current-context
-- gke_my-project_us-east4_autopilot-cluster-1

gcloud init
gcloud config
gcloud auth login
gcloud container clusters get-credentials autopilot-cluster-1 --zone us-east4
kubectl config view

```

### First time only, create namespace for deployments (katzemeo)
```
kubectl get namespaces
kubectl create namespace katzemeo
```

### Customize resources (env variables, secrets etc.) in clone from Git repo
```
cd gcp
kubectl apply -f ./gke_autopilot_https.yaml -n katzemeo
-- managedcertificate.networking.gke.io/managed-cert configured
-- service/katzemeo-np created
-- ingress.networking.k8s.io/katzemeo-ingress configured

!!WAIT until nodeport IP is provisioned and ingress is ACTIVE

kubectl apply -f ./gke_autopilot_deployment.yaml -n katzemeo
-- deployment.apps/katzemeo configured
-- service/katzemeo created
```