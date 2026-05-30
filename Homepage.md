# 🌐 Complete Guide: Hosting a Website on Windows Server + Local‑Only Custom Domain Setup

This guide covers:

- Hosting a website on Windows Server  
- Setting up IIS  
- Using a public domain  
- Understanding why custom TLDs like `.mosberg` don’t work publicly  
- Creating a **local‑only** domain such as `homepage.mosberg`  
- Setting up Windows DNS for internal use  
- Hosts‑file method  

---

# 🧭 1. Hosting a Website on Windows Server

Windows Server can host websites using **IIS (Internet Information Services)**.  
You can host:

- Static HTML/CSS/JS  
- ASP.NET / .NET Core  
- PHP (with PHP installed)  
- Internal dashboards  
- Private LAN services  

---

## ⚙️ 1.1 Install IIS

**Server Manager → Add Roles and Features → Web Server (IIS)**

Or PowerShell:

```powershell
Install-WindowsFeature -name Web-Server -IncludeManagementTools
```

---

## 🏗️ 1.2 Create a Website in IIS

Open **IIS Manager** (`inetmgr`):

1. Right‑click **Sites → Add Website**
2. Fill in:
   - **Site name:** `Homepage`
   - **Physical path:** Folder with your website files
   - **Binding:**
     - Type: `http`
     - Port: `80`
     - Hostname: `homepage.mosberg` (or your public domain)

Example binding:

```
Type: HTTP
IP Address: All Unassigned
Port: 80
Hostname: homepage.mosberg
```

---

# 🌍 2. Public Website Hosting (Optional)

If you want your site reachable from the internet, you need:

- A **registered domain** (e.g., mosberg.com)
- A **public IP address**
- **Port forwarding** (80/443) if behind a router
- DNS **A‑record** pointing to your server

---

## ❌ Why you cannot use `homepage.mosberg` publicly

To use `.mosberg` as a real internet TLD, you must:

- Apply to ICANN  
- Pay **$185,000 USD** application fee  
- Pay **$25,000 USD per year**  

This is why only big companies own custom TLDs like `.google` or `.apple`.

---

## ✔️ What you *can* use publicly

You can register:

- `mosberg.com`
- `mosberg.dk`
- `mosberg.io`

Then create subdomains:

- `homepage.mosberg.com`
- `home.mosberg.dk`

---

# 🏠 3. Local‑Only Domain Setup (No Registration Needed)

You *can* create private domains like:

- `homepage.mosberg`
- `server.rasmus`
- `intranet.local`

These work **only inside your LAN**.

Two methods:

1. **Windows Server DNS** (recommended)  
2. **Hosts file** (quick & dirty)

---

# 🛠️ 4. Method A — Windows Server DNS (Recommended)

## 4.1 Install DNS Server Role

**Server Manager → Add Roles and Features → DNS Server**

---

## 4.2 Create a Private DNS Zone

Open **DNS Manager**:

1. Right‑click **Forward Lookup Zones → New Zone**
2. Choose:
   - **Primary Zone**
   - **Store in Active Directory** (if using AD)
3. Zone name:

```
mosberg
```

This creates a private DNS namespace.

---

## 4.3 Add a Host Record

Inside the `mosberg` zone:

- Right‑click → **New Host (A or AAAA)**
- Name: `homepage`
- IP Address: your server’s LAN IP (example: `192.168.1.10`)

This creates:

```
homepage.mosberg → 192.168.1.10
```

---

## 4.4 Make Your Network Use Your DNS Server

Set your router’s DHCP DNS to:

```
DNS Server: 192.168.1.10
```

Now every device on your network can access:

```
http://homepage.mosberg
```

---

# 🧪 5. Method B — Hosts File (Quick & Dirty)

Works on **one device at a time**.

Edit:

```
C:\Windows\System32\drivers\etc\hosts
```

Add:

```
192.168.1.10   homepage.mosberg
```

Now that device can visit:

```
http://homepage.mosberg
```

---

# 🧭 6. Summary Table

| Feature | Public Domain | Local‑Only Domain |
|--------|---------------|------------------|
| Example | homepage.mosberg.com | homepage.mosberg |
| Requires registration | ✔️ Yes | ❌ No |
| Works on internet | ✔️ Yes | ❌ No |
| Works on LAN | ✔️ Yes | ✔️ Yes |
| Needs DNS server | Optional | Recommended |
| Needs port forwarding | ✔️ Yes | ❌ No |

---

# 🧱 7. Local Domain Architecture Overview

```
+---------------------------+
| Windows Server            |
| - IIS (Website)           |
| - DNS Server (mosberg)    |
+-------------+-------------+
              |
              | DNS resolves homepage.mosberg → 192.168.1.10
              |
+-------------v-------------+
| Router / DHCP             |
| - DNS = Windows Server    |
+-------------+-------------+
              |
              |
+-------------v-------------+
| Client Devices            |
| - PC, Laptop, Phone       |
| - Access http://homepage.mosberg
+---------------------------+
```

---

# 🎯 8. Next Steps

You can now:

- Host internal sites  
- Add more subdomains (e.g., `files.mosberg`, `media.mosberg`)  
- Add HTTPS using internal certificates  
- Build a full intranet

---***---

# Automation

1. PowerShell automation script (server prep)

This script installs IIS + DNS, opens firewall ports, and sets basic services.

`powershell
<#
.SYNOPSIS
  Base setup for a local web + DNS server on Windows Server.

.NOTES
  Run in elevated PowerShell.

>

--- Variables ---
$webFeature   = 'Web-Server'
$dnsFeature   = 'DNS'
$httpPort    = 80
$httpsPort   = 443

Write-Host "Installing IIS and DNS roles..." -ForegroundColor Cyan
Install-WindowsFeature -Name $webFeature -IncludeManagementTools -ErrorAction Stop
Install-WindowsFeature -Name $dnsFeature -IncludeManagementTools -ErrorAction Stop

Write-Host "Opening firewall ports for HTTP/HTTPS..." -ForegroundColor Cyan
New-NetFirewallRule -DisplayName "HTTP-In"  -Direction Inbound -Protocol TCP -LocalPort $httpPort  -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "HTTPS-In" -Direction Inbound -Protocol TCP -LocalPort $httpsPort -Action Allow -ErrorAction SilentlyContinue

Write-Host "Ensuring services are running..." -ForegroundColor Cyan
$services = 'W3SVC','DNS'
foreach ($svc in $services) {
    Set-Service -Name $svc -StartupType Automatic
    Start-Service -Name $svc
}

Write-Host "Base server prep completed." -ForegroundColor Green
`

---

2. DNS + IIS auto‑setup script (for homepage.mosberg)

This script:

- Creates DNS zone mosberg
- Adds homepage.mosberg → server IP
- Creates IIS site bound to homepage.mosberg

`powershell
<#
.SYNOPSIS
  Configure DNS zone + IIS site for a local-only domain.

.PARAMETER ZoneName
  DNS zone name (e.g. 'mosberg').

.PARAMETER HostName
  Host name inside the zone (e.g. 'homepage').

.PARAMETER SitePath
  Physical path for the IIS site.

.PARAMETER SiteName
  IIS site name.

.PARAMETER IpAddress
  Server LAN IP (for DNS A record).

>

param(
    [string]$ZoneName  = 'mosberg',
    [string]$HostName  = 'homepage',
    [string]$SitePath  = 'C:\Sites\Homepage',
    [string]$SiteName  = 'Homepage',
    [string]$IpAddress = (Get-NetIPAddress -AddressFamily IPv4 `
                          | Where-Object {$.InterfaceAlias -notlike 'vEthernet' -and $.IPAddress -notlike '169.254*'} `
                          | Select-Object -First 1 -ExpandProperty IPAddress)
)

Import-Module DNSServer -ErrorAction Stop
Import-Module WebAdministration -ErrorAction Stop

$Fqdn = "$HostName.$ZoneName"

Write-Host "Using IP: $IpAddress" -ForegroundColor Cyan
Write-Host "FQDN: $Fqdn" -ForegroundColor Cyan

--- DNS Zone ---
if (-not (Get-DnsServerZone -Name $ZoneName -ErrorAction SilentlyContinue)) {
    Write-Host "Creating DNS zone '$ZoneName'..." -ForegroundColor Cyan
    Add-DnsServerPrimaryZone -Name $ZoneName -ZoneFile "$ZoneName.dns"
} else {
    Write-Host "DNS zone '$ZoneName' already exists." -ForegroundColor Yellow
}

--- DNS A Record ---
if (-not (Get-DnsServerResourceRecord -ZoneName $ZoneName -Name $HostName -RRType A -ErrorAction SilentlyContinue)) {
    Write-Host "Creating A record $Fqdn -> $IpAddress..." -ForegroundColor Cyan
    Add-DnsServerResourceRecordA -ZoneName $ZoneName -Name $HostName -IPv4Address $IpAddress
} else {
    Write-Host "A record for $Fqdn already exists." -ForegroundColor Yellow
}

--- IIS Site Folder ---
if (-not (Test-Path $SitePath)) {
    Write-Host "Creating site folder: $SitePath" -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $SitePath | Out-Null
    "<h1>Welcome to $Fqdn</h1>" | Out-File -FilePath (Join-Path $SitePath 'index.html') -Encoding utf8
}

--- IIS Site ---
$existingSite = Get-Website -Name $SiteName -ErrorAction SilentlyContinue
if ($existingSite) {
    Write-Host "IIS site '$SiteName' already exists." -ForegroundColor Yellow
} else {
    Write-Host "Creating IIS site '$SiteName'..." -ForegroundColor Cyan
    New-Website -Name $SiteName -PhysicalPath $SitePath -Port 80 -HostHeader $Fqdn -IPAddress '*'
}

Write-Host "DNS + IIS configuration completed for $Fqdn" -ForegroundColor Green
Write-Host "Remember: configure your router/DHCP to use this server as DNS." -ForegroundColor Yellow
`

---

3. Local CA + HTTPS certificate guide

Below is a concise guide to:

- Create a local root CA
- Issue a site certificate for homepage.mosberg
- Bind it in IIS
- Trust the root CA on clients

---

3.1 Create a local root CA certificate

Run in elevated PowerShell on the server:

`powershell

Root CA certificate (self-signed)
$rootCert = New-SelfSignedCertificate `
    -Subject "CN=Mosberg Local Root CA" `
    -KeyExportPolicy Exportable `
    -KeyUsage CertSign, CRLSign, DigitalSignature `
    -KeyLength 4096 `
    -KeyAlgorithm RSA `
    -HashAlgorithm SHA256 `
    -CertStoreLocation "Cert:\LocalMachine\My" `
    -NotAfter (Get-Date).AddYears(10) `
    -TextExtension @("2.5.29.19={critical}{text}ca=TRUE&pathlength=1")

$rootThumb = $rootCert.Thumbprint
$rootThumb
`

Export the root CA certificate (public only):

`powershell
$rootPath = "C:\Certs"
New-Item -ItemType Directory -Path $rootPath -ErrorAction SilentlyContinue | Out-Null

Export-Certificate `
    -Cert "Cert:\LocalMachine\My\$rootThumb" `
    -FilePath (Join-Path $rootPath "MosbergRootCA.cer")
`

You’ll distribute MosbergRootCA.cer to clients later.

---

3.2 Create a site certificate for homepage.mosberg

`powershell
$zoneName = "mosberg"
$hostName = "homepage"
$fqdn     = "$hostName.$zoneName"

Use the existing root CA as issuer
$rootCA = Get-ChildItem Cert:\LocalMachine\My | Where-Object {
    $_.Subject -eq "CN=Mosberg Local Root CA"
}

$siteCert = New-SelfSignedCertificate `
    -Subject "CN=$fqdn" `
    -DnsName $fqdn `
    -KeyExportPolicy Exportable `
    -KeyLength 2048 `
    -KeyAlgorithm RSA `
    -HashAlgorithm SHA256 `
    -CertStoreLocation "Cert:\LocalMachine\My" `
    -Signer $rootCA `
    -NotAfter (Get-Date).AddYears(3)

$siteThumb = $siteCert.Thumbprint
$siteThumb
`

---

3.3 Bind HTTPS in IIS

Use the thumbprint from above:

`powershell
Import-Module WebAdministration

$siteName   = "Homepage"          # same as in previous script
$fqdn       = "homepage.mosberg"  # your local FQDN
$siteThumb  = $siteThumb          # from previous step

Remove existing HTTPS binding if any
Get-WebBinding -Name $siteName -Protocol "https" -ErrorAction SilentlyContinue | Remove-WebBinding

Add HTTPS binding
New-WebBinding -Name $siteName -Protocol "https" -Port 443 -HostHeader $fqdn -IPAddress "*"

Assign certificate to binding
Push-Location IIS:\SslBindings
New-Item "0.0.0.0!443!$fqdn" -Thumbprint $siteThumb -SSLFlags 1
Pop-Location
`

Now IIS serves https://homepage.mosberg using your local CA–issued certificate.

---

3.4 Trust the root CA on client machines

Copy C:\Certs\MosbergRootCA.cer to each client and:

On Windows clients

1. Run mmc.exe
2. File → Add/Remove Snap-in → Certificates → Computer account
3. Navigate to:  
   Trusted Root Certification Authorities → Certificates
4. Right‑click → All Tasks → Import
5. Import MosbergRootCA.cer

Or via PowerShell (on the client):

`powershell
$rootPath = "C:\Temp\MosbergRootCA.cer"  # adjust path
Import-Certificate `
    -FilePath $rootPath `
    -CertStoreLocation "Cert:\LocalMachine\Root"
`

After this, browsers on that client will trust https://homepage.mosberg without warnings.

---

If you tell me your exact server IP and preferred paths, I can tailor these scripts to your environment so you can almost just paste–run.