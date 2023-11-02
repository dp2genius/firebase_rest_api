# RESTful API

**Step-by-Step**
---

1. Install firebase tools 

    ```bash
    $ npm install -g firebase-tools
    $ firebase login
    $ firebase init
    ```

2. Start emulators for local environment
    ```bash
    $ firebase emulators:start
    ```

3. Get Privatekey  

    To authenticate a service account and authorize it to access Firebase services, you must generate a private key file in JSON format.
    * Project settings -> Service accounts -> Generate new privateKey
    https://console.firebase.google.com/project/vehiclehubdev/settings/serviceaccounts/adminsdk

    * Click button `Generate new private key`

4. [`IAM config`](https://console.cloud.google.com/iam-admin/iam)

    First, go to your Google Cloud Platform IAM & admin page. You'll see various service accounts. Look for the service account that looks like `myapp-cd99d@appspot.gserviceaccount.com`. It should say App Engine default service account in the Name column.

    You must add role *Service Account Token Creator*, *Storage Object Creator* to
    have permission to create signed tokens and run `getSignedURL()`.

    You could save alternatively assign *Service Account Admin* and *Storage Admin*, which include the *Service Account Token Creator* and *Storage Object Creator* roles respectively.

**Successfully deployed**
---

- Function URL  
https://download-kh5664evwa-uc.a.run.app  

- Project Console  
https://console.firebase.google.com/project/vehiclehubdev/overview

**How to use it**
---

**Endpoint**: https://download-kh5664evwa-uc.a.run.app?files=[`file_name1`,`file_name2`]

Response:
```json
{
    "success": true,
    "signedUrl": "https://",
    "errors": [
        "error_1",
        "error_2",
        "...",
    ]
}
```

If `response.success` is `true` then ``response.signedUrl` is valid. You can download zip file by making GET request. This URL is signed URL and valid for one day. You can always change expiry time.

**Example**
---

Storage:
```
├───avatar.png
└───folder1
    └───my_avatar.png
```
Endpoint:  
https://download-kh5664evwa-uc.a.run.app?files=["avatar.png","folder1/my_avatar.png"]

Response:
```json
{
    "success":true,
    "signedUrl":"https://storage.googleapis.com/vehiclehubdev.appspot.com/Download-1698927004091-92505.zip?GoogleAccessId=firebase-adminsdk-sg8xt%40vehiclehubdev.iam.gserviceaccount.com&Expires=1698930604&Signature=wPCyuFnTWrgC5jZLWbvbR0yZvqXjCc9q4V%2BGTj99%2BwIniSn6r3MxkXdIxpm3b6n1SSzToMSn%2FjyCalLyvNS6EvM7FFgxbJYQB6xDYxmAQmh789d8O9IA54Nb%2F7PhGHL%2BiSicmDAyfzppSOwp2l%2FQjZd1KH7pq9aJYk6vdGMy88HBhlL1mt4QdTGyWgxxQmykskuOvbl6P6s%2FMjTWYAg8zmNOujlrgYVcKGrB7hJcganUV67b2zNJFd6sMWisMilxn%2FgNEbp0IFjqMsKss78s9TIZ1XRfJ75KJO1c4U%2FVr1H4xN8XXdMjEYu%2BCUqwWoHRZFRMlM4wf46h60dPVYRkPQ%3D%3D",
    "errors": [
        "Requested file folder1/my_avatar.png does not exists.","Requested file avatar.png does not exists."
    ]
}
```
