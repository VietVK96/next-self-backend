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
```
GOOGLE_CLIENT_ID=340536610100-pm89o884nqfaija6in6qe7kvq9dr61f0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
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
