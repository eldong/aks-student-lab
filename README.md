# AKS Advanced Topics Student Lab

This repository is a self-contained beginner lab covering:

1. LimitRange and ResourceQuota
2. Vertical Pod Autoscaler
3. Horizontal Pod Autoscaler

All Kubernetes manifests required by the workbook are included under
`manifests`. Students do not need the instructor demo repository.

## Prerequisites

- An existing AKS cluster
- Windows PowerShell
- Azure CLI (`az`)
- Kubernetes CLI (`kubectl`)
- Access to the AKS cluster
- Permission to create namespaces and workloads
- Permission to read the AKS and ACR configuration
- Permission to run ACR builds
- Instructor or cluster-owner assistance if the VPA add-on must be enabled

Before starting, the instructor-provided setup must already have:

- Completed `az login`
- Created the AKS cluster
- Created the Azure Container Registry
- Granted the AKS cluster pull permission on the ACR
- Set these PowerShell variables:

```powershell
$RESOURCE_GROUP = '<aks-resource-group>'
$AKS_NAME = '<aks-cluster-name>'
$ACR_NAME = '<acr-name>'
```

The repository includes source for both required images. The workbook builds
them in the pre-created ACR and updates the local manifests to use that
registry.

## Clone and start

```powershell
git clone <repository-url>
Set-Location .\<cloned-repository-folder>
Start-Process .\index.html
```

For example, if the GitHub repository is named `student-lab`:

```powershell
git clone <repository-url>
Set-Location .\student-lab
Start-Process .\index.html
```

Run all workbook commands from the folder containing `index.html`. Keep the
same PowerShell window open because the lab variables exist only in that
window.

## Included files

```text
student-lab
|-- index.html
|-- README.md
|-- manifests
    |-- 01-limit-ranges-resource-quotas
    |-- 02-vertical-pod-autoscaler
    `-- 03-horizontal-pod-autoscaler
`-- images
    |-- weather-api
    `-- hpa-demo
```

## Permissions

Modules 1 and 3 require Kubernetes permissions to create namespaces, Pods,
Deployments, Services, ResourceQuotas, LimitRanges, and HPAs.

Module 2 also checks the AKS VPA add-on:

```powershell
az aks show
az aks update --enable-vpa
```

If VPA is disabled and the student cannot enable cluster features, an
instructor or cluster owner must enable it.

The initial setup uses:

```powershell
az acr build
```

Students do not create or attach an ACR in this lab.

## Cost notes

- The instructor-provided ACR is reused; the student lab does not create a new
  registry.
- ACR build tasks consume registry build resources.
- The optional VPA add-on is cluster-scoped and may require owner approval.
- This lab does not create Log Analytics or other Azure Monitor resources.

## Timing notes

- Newly created Pods can take 30-90 seconds to appear in `kubectl top`.
- VPA recommendations can take several minutes to appear.
- VPA pod replacement is not instantaneous.
- HPA decisions and metrics updates are periodic.
- HPA scale-down is intentionally slower than scale-up.

These delays are expected and are explained in the workbook.

## Cleanup

Normal cleanup removes only the three lab namespaces:

```powershell
kubectl delete namespace aks-governance-demo --ignore-not-found=true
kubectl delete namespace aks-vpa-demo --ignore-not-found=true
kubectl delete namespace aks-hpa-demo --ignore-not-found=true
```

Do not disable the cluster-level VPA add-on unless instructed by the cluster
owner.
