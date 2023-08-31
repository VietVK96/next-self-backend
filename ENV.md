# ENV Configurations

## The app port
PORT=3000

## The app host
HOST=http://localhost:3000

## Configs for Swagger API Document
### Showing Swagger 
IS_SWAGGER={true | false}
- true: show Swagger Doc
- false: not allow to show Swagger Doc

### Set base api to Swagger
SWAGGER_BASE_API={string}   
Ex: SWAGGER_BASE_API=/

## Configs for database connection
DATABASE_TYPE: type of database   
DATABASE_MASTER_HOST: the database host  
DATABASE_MASTER_PORT: the database port  
DATABASE_MASTER_USERNAME: the username of database credential   
DATABASE_MASTER_PASSWROD: the password of database credential  
DATABASE_MASTER_NAME: the name of schema

<!-- # DATABASE_SLAVES_HOST=127.0.0.1
# DATABASE_SLAVES_PORT=33062
# DATABASE_SLAVES_USERNAME=root
# DATABASE_SLAVES_PASSWROD=somewordpress
# DATABASE_SLAVES_NAME=dental_old -->

## Configs for Redis connection
REDIS_HOST: the redis host  
REDIS_PORT: the redis port  
REDIS_DB: the redis name   
REDIS_USERNAME: redis username  
REDIS_PASSWORD: redis password  

### The upload directory path
UPLOAD_DIR=/home/lts/Public/VFR/backend

### The base url of image resources
IMAGE_URL=http://localhost:3000

### The provided SESAM_VITALE connection by client
SESAM_VITALE_CNDA=false  
SESAM_VITALE_END_POINT="https://dentalvia-fsv-recette.juxta.cloud"  
SESAM_VITALE_HOST="localhost"  
SESAM_VITALE_PORT=1234  
LOGSTACK_ENABLE=true

### Set log request or not
LOG_REQUEST={true | false}  

### Configs for MailTrap service  
Steps to get configs
1. Login to MailTrap [mailtrap.io](https://mailtrap.io)
2. Click Email Testing -> Inbox
3. On SMTP Settings tab, click **Show Credentials**  
4. We have the mailtrap credential information like image below:  

  ![image](https://github.com/giangdt1215/wecleverss/assets/14262924/c5ce1d25-4b6c-47a4-93bd-b3e5fabc0f53)  

5. From this credential information above, we can set the credential into env file like this:
  
    ```
    EMAIL_HOST=sandbox.smtp.mailtrap.io
    EMAIL_PORT=2525
    EMAIL_USER=67adb3b396d749
    EMAIL_PASSWORD=87dbd1d1e0676a
    EMAIL_FROM_USER=thanhna@ltsgroup.tech
    ``````

### Credential for using Google calendar service
1. Login [Google Console Project](https://console.developers.google.com/project)
2. Create project  

  ![image](https://github.com/giangdt1215/wecleverss/assets/14262924/a33a7869-83b8-43e1-99f5-56564c4ef234)  

  ![image](https://github.com/giangdt1215/wecleverss/assets/14262924/dd53a65d-0320-42f6-9e23-f1af1d11d8fc)  

3. When create process done, click **Select Project**  

  ![image](https://github.com/giangdt1215/wecleverss/assets/14262924/d99f0520-4de9-41e5-a2dc-2828c8933ea7)  

4. Select **APIs & Services**  -> **Enabled APIs & services**  

  ![image](https://github.com/giangdt1215/wecleverss/assets/14262924/fadf1720-3e7d-43e4-b163-5431987d8972)  

5. Select **ENABLE APIS AND SERVICES** to add api  

  ![image](https://github.com/giangdt1215/wecleverss/assets/14262924/c1a00ba9-c352-4f0f-b17d-553c8175b8eb)  

6. Search service. For example: Calendar  

  ![image](https://github.com/giangdt1215/wecleverss/assets/14262924/76575f02-33e8-45c0-81d0-45d6ef71948d)  

7. Select service then click **Enable**  

  ![image](https://github.com/giangdt1215/wecleverss/assets/14262924/456d1db0-70b4-47fd-9162-76bd4cd59155)  

8. After enable service successfully, click **Credentials**  

9. Select **Create credentials** -> **Oauth client ID**  

  ![image](https://github.com/giangdt1215/wecleverss/assets/14262924/59405eb2-edad-4373-88bb-e50c8da4b66a)  

10. Choose **Application Type**, fill the name then click **Create**  

  ![image](https://github.com/giangdt1215/wecleverss/assets/14262924/37038688-c085-47a9-a52c-d374a39a3cc6)  

11. After create oauth2 credential, we have the information like this:  

  ![image](https://github.com/giangdt1215/wecleverss/assets/14262924/41eb0235-319c-4c73-963c-978e09cb066a)  

12. We can fill the **Client ID** and **Client Secret** in env file:  

  ```
  GOOGLE_CLIENT_ID=584971720532-nkrki9dsfse1as5lmbckk7nevs2ih40u7r87.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=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tp6P7c
  CLIENT_SIDE=http://localhost:5173
  emailTest=fcmanutd1878@gmail.com
  ```
### The provided Claude Bernard service config by client
CLAUDE_BERNARD_CODE_EDITEUR=ECOODENTIST
CLAUDE_BERNARD_END_POINT='https://www.bcbdexther.fr/wsdl/BCBDexther-integrateurs-full.wsdl'  

### The provided WZAGENDA service config by client
WZAGENDA_END_POINT="https://secure.wz-agenda.net/webservices/3.1/server.php?wsdl"  
WZAGENDA_END_POINT="https://secure.wz-agenda.net/webservices/3.1/server.php#wzcalendar"

### The provided monetico configs by client
MONETICO_COMPANY_CODE=ECOODENTIST
MONETICO_EPT_CODE=6290886
MONETICO_SECURITY_KEY=FF23C97BA6B760A6E3BBE298DA18415334558D92

### The key for database encryption/decryption
HALITE_KEY={string}

### Config sent feedback emails
```
MAIL_FEED_BACK_SUGGESTION=eng@dentalviamedilor.com,sales@dentalviamedilor.com
MAIL_FEED_BACK_COMMERCIAL=sales@dentalviamedilor.com
MAIL_FEED_BACK_ADMINISTRATIF=admin@dentalviamedilor.com
```

### The mail template directory path
MAIL_FOLDER_TEMPLATE=/home/duc/dental/backend/templates/
