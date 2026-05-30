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