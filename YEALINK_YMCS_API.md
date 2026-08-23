# Yealink Management Cloud Service V4X API Reference

> Codex/developer reference for implementing Yealink Management Cloud
> Service (YMCS) V4X device provisioning.

## 1. Environment

### API Domain

``` text
https://eu-api.ymcs.yealink.com
```

All endpoint paths in this document are relative to the tenant's regional
YMCS API domain.

For the current `NIMBUSIP` tenant, the Enterprise Information screen
shows **Data Center = EU**, so the default base URL for this project is:

``` text
https://eu-api.ymcs.yealink.com
```

If Yealink provides a tenant in another region, switch only the host
prefix:

``` text
US: https://us-api.ymcs.yealink.com
AU: https://au-api.ymcs.yealink.com
```

### Credentials

``` text
AccessKey ID: ${YMCS_ACCESS_KEY_ID}
AccessKey Secret: ${YMCS_ACCESS_KEY_SECRET}
```

**Security requirement:** The AccessKey Secret supplied for this project
must be stored in an environment variable or secret manager and MUST NOT
be committed to source control, embedded in frontend/client-side code,
written to logs, or included in production documentation. Use
`YMCS_ACCESS_KEY_SECRET` at runtime.

Recommended environment variables:

``` text
YMCS_REGION=EU
YMCS_BASE_URL=https://eu-api.ymcs.yealink.com
YMCS_ACCESS_KEY_ID=<access-key-id>
YMCS_ACCESS_KEY_SECRET=<access-key-secret>
YMCS_TOKEN_PATH=v2/token
```

## 2. Device Management

### 2.0 List Device Models

**Method:** `GET`\
**Path:** `/v2/dm/models`\
**Example:** `/v2/dm/models?deviceType=1`

Query parameters:

  ------------------------------------------------------------------------
  Field            Type                          Required Description
  ---------------- ---------------- --------------------- ----------------
  `deviceType`     integer                            Yes `1` = Phone
                                                          Device; `3` =
                                                          Room Device.
  ------------------------------------------------------------------------

Vendor clarification received on **August 17, 2026**: this request does
**not** need site information. Do not attach `siteId`, site name, or
other site-scoped fields when listing models from this endpoint.

### 2.1 Add a Single Device

**Method:** `POST`\
**Path:** `/v2/dm/devices`\
**Full URL:** `https://eu-api.ymcs.yealink.com/v2/dm/devices`

Request body:

  ------------------------------------------------------------------------
  Field            Type                          Required Description
  ---------------- ---------------- --------------------- ----------------
  `mac`            string                             Yes Device MAC
                                                          address, 12-17
                                                          characters.

  `sn`             string                             Yes Device serial
                                                          number, maximum
                                                          128 characters.

  `deviceType`     integer                            Yes `1` = Phone
                                                          Device; `3` =
                                                          Room Device.

  `modelId`        string                             Yes YMCS device
                                                          model ID.

  `name`           string                              No Device name,
                                                          maximum 128
                                                          characters.

  `siteId`         string                              No YMCS site ID.
  ------------------------------------------------------------------------

> **Documentation ambiguity:** Yealink marks `modelId` as required,
> although its published single-device example omits it. Implementations
> should treat `modelId` as required unless API testing proves
> otherwise.

Example:

``` json
{
  "mac": "001565bbb1a9",
  "sn": "1106312113402006",
  "name": "my t54s",
  "modelId": "61e659e4d78d42ebada88ef1eb751b64",
  "deviceType": 1
}
```

Status codes: `201` success, `400` invalid parameters, `401`
authentication failure, `500` server error.

Example success response:

``` json
{
  "id": "8d07a56207074d26b61026099625b9e2",
  "mac": "001565bbb1a9",
  "sn": "1106312113402006",
  "name": "my t54s",
  "modelId": "61e659e4d78d42ebada88ef1eb751b64",
  "siteId": "a624453e1cbb44ecb9bb6ee31731a856",
  "programVersion": "70.83.0.68"
}
```

### 2.2 Add Devices in Batches

**Method:** `POST`\
**Path:** `/v2/dm/addDevices`\
**Maximum:** 100 devices per request.

Each array item supports `mac`, `sn`, `deviceType`, `modelId`, optional
`name`, and optional `siteId`.

Example:

``` json
[
  {
    "mac": "3a1565bbb1a9",
    "sn": "1106312113402006",
    "name": "my t54s",
    "modelId": "61e659e4d78d42ebada88ef1eb751b64",
    "deviceType": 1
  }
]
```

A `200 OK` means the batch request was processed; it does **not**
guarantee that all devices were added. Always inspect `total`,
`successCount`, `failureCount`, and `errors`.

### 2.3 Add Devices Without SN

**Method:** `POST`\
**Path:** `/v2/dm/addDevicesByMac`\
**Maximum:** 100 devices per request.

Each array item supports `mac`, `deviceType`, `modelId`, optional
`name`, and optional `siteId`. `sn` is not required.

Example:

``` json
[
  {
    "mac": "3a1565bbb1a9",
    "name": "my t54s",
    "modelId": "61e659e4d78d42ebada88ef1eb751b64",
    "deviceType": 1
  }
]
```

The error response may still contain an `sn`; clients should therefore
treat response-side `sn` as optional/nullable.

## 3. Supported Device Models and Minimum Versions

`No limiting` means the supplied source does not specify a minimum
firmware/version restriction.

### 3.1 Phone Devices --- SIP Phones

  -------------------------------------------------------------------------------------------------------------------------
  Device models                                                                         Minimum version / requirement
  ------------------------------------------------------------------------------------- -----------------------------------
  SIP-T23G/T27P/T27G/T29G/T40G/T41P/T41S/T42G/T42S/T42U/T46G/T46S/T48G/T48S/T52S/T54S   `XX.83.0.30` or later, except
                                                                                        `XX.84.0.10`. `XX` is the fixed
                                                                                        number for each model.

  SIP-T23P                                                                              `44.83.0.35` or later

  SIP-T44W                                                                              No limiting

  SIP-T44U                                                                              No limiting

  SIP-T34W                                                                              No limiting

  SIP-T31W                                                                              No limiting

  AX83H                                                                                 No limiting

  AX86R                                                                                 No limiting

  T64LTE                                                                                No limiting

  T67LTE                                                                                No limiting

  SIP-T58A                                                                              No limiting

  SIP-T19(P)E2                                                                          `53.83.0.20` or later

  SIP-T21(P)E2                                                                          `52.83.0.20` or later

  SIP-T40P                                                                              `54.83.0.31` or later

  SIP-T56A/T58                                                                          `58.83.0.5` or later

  SIP-T53/T53W                                                                          `95.84.0.10` or later

  SIP-T54W                                                                              `95.84.0.10` or later

  SIP-T57W                                                                              `97.84.0.30` or later

  SIP-T42U/T43U/T46U/T48U                                                               `97.84.0.30` or later

  SIP-T30/T30P/T31/T31P/T31G/T33P/T33G                                                  `124.85.0.10` or later

  SIP-T53C                                                                              `96.86.0.20` or later

  SIP-T58W                                                                              `150.86.0.5` or later
  -------------------------------------------------------------------------------------------------------------------------

### 3.2 Phone Devices --- DECT

  Device models   Minimum version / requirement
  --------------- -------------------------------
  W60B            `77.85.0.25` or later
  W70B            `146.85.0.20` or later
  W75DM           No limiting
  W80DM           `103.83.0.20` or later
  W90DM           `130.85.0.20` or later

### 3.3 Conference Phones

  Device models   Minimum version / requirement
  --------------- -------------------------------
  CP960           `73.83.0.10` or later
  CP920           `78.84.0.15` or later
  CP925           `149.85.254.26` or later
  CP965           `148.85.254.31` or later
  CP935W          `143.85.254.32` or later

### 3.4 Video Conferencing Phone

  Device models   Minimum version
  --------------- ------------------------
  VP59            `91.283.0.10` or later

### 3.5 Zoom Phones

  Device models                         Minimum version
  ------------------------------------- ------------------------
  CP960                                 `73.30.0.10` or later
  MP54 (Zoom)/MP56 (Zoom)/MP58 (Zoom)   `122.30.0.10` or later
  VP59                                  `91.30.0.20` or later

### 3.6 Skype for Business (SFB) Phones

  Device models         Minimum version / requirement
  --------------------- ------------------------------------------
  T41S/T42S/T46S/T48S   `66.9.0.45` or later, except `66.9.0.46`
  T58/T56A/T55A         `55.9.0.6` or later
  CP960                 `73.8.0.27` or later
  MP56                  `122.9.0.1` or later
  MP54/MP58             `122.9.0.5` or later

### 3.7 Teams Phones

> Limitation from source documentation: managing accounts and viewing
> call quality is unavailable for this category.

  Device models               Minimum version
  --------------------------- ------------------------
  CP960                       `73.15.0.20` or later
  CP965                       `143.15.0.7` or later
  T56A/T58                    `58.15.0.20` or later
  T55A                        `58.15.0.36` or later
  VP59                        `91.15.0.16` or later
  MP56/MP56 E2                `176.15.0.9` or later
  MP54/MP58/MP54 E2/MP58 E2   `176.15.0.25` or later
  MP52/MP52 E2                `176.15.0.4` or later

### 3.8 Teams Room Devices

  Device models             Minimum version / requirement
  ------------------------- -------------------------------
  MeetingBar A10            `278.320.0.2` or later
  MeetingBar A20            `133.15.0.20` or later
  MeetingBar A30            `133.15.0.42` or later
  MeetingBar A40            No limiting
  DeskVision A24 (Teams)    `156.15.0.2` or later
  MeetingBoard 65 (Teams)   `155.15.0.0` or later
  MeetingBoard 86 (Teams)   `155.15.0.17` or later
  VC210 (Teams)             `118.15.0.20` or later

### 3.9 VC Room Devices

  -----------------------------------------------------------------------
  Device models                       Minimum version / requirement
  ----------------------------------- -----------------------------------
  VC200/VC500/VC800/VC880             `XX.32.10.25` / `XX.32.0.25` or
                                      later; `XX` is model-specific

  PVT950/PVT980                       `1345.32.10.40` or later

  MeetingEye 900                      No limiting

  MeetingBar A10                      `278.15.0.2` or later

  MeetingBar A20                      `133.10.0.19` or later

  MeetingBar A30                      `133.10.0.23` or later

  MeetingBoard 65                     `155.15.0.26` or later

  MeetingBoard 86                     `155.15.0.26` or later

  MeetingBoard 65/75/86 Pro           `331.320.0.30` or later

  DeskVision A24                      `156.15.0.24` or later

  VP59                                `91.332.0.10` or later

  PVT940/PVT960                       `120.43.0.25` or later

  MeetingEye 600/MeetingEye 400       `120.43.0.5` or later

  MeetingEye 400 Pro                  YMS: `133.352.0.1` or later; Cloud:
                                      `133.352.1000.1` or later

  MeetingEye 800                      `129.351.0.10` or later

  VC200-E/VC210 Pro                   `118.50.0.10` or later

  VC210                               `118.43.0.1` or later

  PVT920                              `118.351.0.1` or later
  -----------------------------------------------------------------------

### 3.10 Zoom Room Devices

  Device models                                 Minimum version
  --------------------------------------------- ------------------------
  MeetingBar A20 (Zoom)/MeetingBar A30 (Zoom)   `133.30.0.35` or later
  CP960-UVC Zoom Rooms Kit                      `73.30.1.54` or later

### 3.11 MVC / ZVC Room Devices

  -----------------------------------------------------------------------
  Device models                       Minimum version / requirement
  ----------------------------------- -----------------------------------
  MVC 940/MVC 900/MVC 860/MVC 840/MVC `XX.11.0.10` or later; `XX` is
  800/MVC 660/MVC 640/MVC 500/MVC     model-specific
  400/MVC 320/MVC 300/MVC 900II/MVC   
  800II/MVC 500II/MVC 300II/MVC       
  S60/CP960-UVC Zoom Rooms            
  Kit/CP965-UVC Zoom Rooms Kit/ZVC    
  Zoom Room Kit                       

  MVC 340                             No limiting

  MVC S40/MVC S90                     No limiting
  -----------------------------------------------------------------------

### 3.12 Third-Party Room Devices

  Device models                      Minimum version
  ---------------------------------- --------------------------
  MeetingBar A20/A30 (Tencent)       `133.50.400.11` or later
  MeetingBar A20/A30 (BlueJeans)     `133.50.401.2` or later
  MeetingBar A20/A30 (RingCentral)   `133.50.25.15` or later

### 3.13 Intelligent Room Devices

  Device models       Minimum version
  ------------------- -------------------------
  RoomCast            `144.320.0.20` or later
  RoomCast (Zoom)     `144.30.0.3` or later
  RoomPanel           `147.511.0.1` or later
  RoomPanel (Zoom)    `147.30.0.10` or later
  RoomPanel (Teams)   `147.15.0.7` or later
  RoomPanel Plus      `269.520.0.12` or later

### 3.14 USB Devices

  -------------------------------------------------------------------------------------
  Device models                                     Minimum version / requirement
  ------------------------------------------------- -----------------------------------
  BH72/BH76/BT50/CP700/CP900/MP50/UH33 E2/UH34/UH34 Yealink USB Connect must be higher
  SE/UH34                                           than `0.33.32.0`
  LITE/UH36/UH37/WDD60/UH38/UVC20/UVC34/WH66/WH67   

  BH71/BH71 Workstation/BH71 Charging Case          BH71: `14.411.0.10`+; Workstation:
                                                    `166.411.0.20`+; Charging Case:
                                                    `22.411.0.5`+

  UVC30                                             `105.422.0.20` or later

  BH74                                              No limiting

  WH64 Headset                                      No limiting

  WH64                                              No limiting

  UVC85-BYOD                                        No limiting

  UVC40 E2                                          No limiting

  UVC85                                             No limiting

  SmartVision 40                                    No limiting

  W74H                                              No limiting

  W71H                                              No limiting

  BH70                                              No limiting

  BH76 Plus                                         No limiting

  WH62/WH63 Portable/WH62 Portable                  `104.432.0.10` or later

  UVC40                                             `128.410.0.10` or later

  UVC84/UVC86                                       Yealink RoomConnect must be higher
                                                    than `282.24.42.0`; UVC84:
                                                    `262.423.0.72`+; UVC86:
                                                    `151.410.0.26`+

  BT51                                              Yealink USB Connect must be higher
                                                    than `0.34.0.10`
  -------------------------------------------------------------------------------------

## 4. Coding-Agent Implementation Rules

1.  Use the tenant's regional API host as the base URL. For the current
    `NIMBUSIP` tenant that is `https://eu-api.ymcs.yealink.com`.
2.  Never hard-code the AccessKey Secret in application source code.
3.  Never expose YMCS credentials to browser/frontend JavaScript. Calls
    requiring the secret must be performed by a trusted backend.
4.  `deviceType=1` means Phone Device and `deviceType=3` means Room
    Device.
5.  Do not guess `modelId` from a model name such as `T54W`; obtain the
    actual YMCS model ID through the appropriate API/data source.
6.  Batch endpoints accept at most 100 devices. Split larger imports
    into chunks of 100 or fewer.
7.  A batch HTTP `200` is not proof of complete success. Inspect
    `failureCount` and `errors`.
8.  Treat `401` as an authentication failure rather than a transient
    retry condition.
9.  Treat firmware/model compatibility separately from `modelId`. A
    model being listed as supported does not by itself provide its YMCS
    `modelId`.
10. Do not invent undocumented device types, model IDs, or alternate
    auth flows. Use the bearer-token flow defined below.

## 5. Authentication

### 5.1 Confirmed Flow

The working YMCS V4X flow is **token-based**, not direct `X-Ca-*`
request signing for `v2/dm/*` calls.

1.  Request an access token from `POST /v2/token`
2.  Send `Authorization: Basic base64(accessKeyId:accessKeySecret)` on
    the token request
3.  Include `timestamp` and `nonce` headers on the token request
4.  Send body `{ "grant_type": "client_credentials" }`
5.  Read `access_token` from the response
6.  Call business APIs such as `GET /v2/dm/models?deviceType=1` and
    `POST /v2/dm/devices`
7.  Send `Authorization: Bearer <access_token>` plus `timestamp` and
    `nonce` on each business request

### 5.2 Token Request

**Method:** `POST`\
**Path:** `/v2/token`

Required headers:

-   `Authorization: Basic base64(accessKeyId:accessKeySecret)`
-   `timestamp: <unix milliseconds>`
-   `nonce: <random string up to 32 chars>`
-   `Accept: application/json`
-   `Content-Type: application/json;charset=UTF-8`

Request body:

``` json
{
  "grant_type": "client_credentials"
}
```

Expected response shape:

``` json
{
  "access_token": "<jwt-or-token>",
  "token_type": "bearer",
  "expires_in": 86400
}
```

Implementation note: refresh the token before its official expiration
instead of waiting for `401`.

### 5.3 Business Request Headers

For `GET /v2/dm/models?deviceType=1` and `POST /v2/dm/devices`, use:

-   `Authorization: Bearer <access_token>`
-   `timestamp: <unix milliseconds>`
-   `nonce: <random string up to 32 chars>`
-   `Accept: application/json`
-   `Content-Type: application/json;charset=UTF-8` for POST bodies only

Do **not** send `Content-MD5`, `X-Ca-Key`, `X-Ca-Nonce`,
`X-Ca-Timestamp`, `X-Ca-Signature`, or `X-Ca-Signature-Headers` for the
current `v2/dm/*` token-based flow.
