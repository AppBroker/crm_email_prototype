Invoicing HTML to PDF Email Prototype
=====================================
As a front end developer I had the idea of creating this microservice prototype when I identified the need to reduce the amount of boiler plate code it would've have taken to generate views and controllers on invoices for my users clients within my CRM and invoicing system. I also wanted to make sure that the PDF's replicas(of html) being sent were exactly as the user had built them on the front end SAAS tool when creating their invoices from the front end invoice building component. I decided that if I had already built views for users to browse their clients invoice history then these same views and pages could be used to generate the emails, PDF attachments and mobile based notifications for those same invoice pages.

I also wanted to seperate any resource intensive email methods away from the main app server for natural performance related reasons hence this service spins up its own node server and is accessed through the main app via an API call.
	
The code in future could also serve as a mechanism whereby it could convert any piece of html/imagery from the system into binary data and inlined html and then into any other format(jpg, png, pdf) from there to be used specifically in email.
I combined a few dependencies, phantomjs, juice and webshot to make it all work. It works alongside PHPMailer and TCPDF in a PHP class on a seperate server.

So far I have tested the "emailAll" functionality firing with success on 500 client emails at once with 100 concurrent users. 

Please note the code is stable however still very much a work in progress.
	
There are 3 separate occasions that my clients may request to send invoices through email within the system.
	
1) By viewing a clients account selecting outstanding transactions and creating an invoice on the fly and sending directly from that particular created invoice.

2) On the users dashboard for time saving purposes use a user may want to invoice all his clients that have outstanding transactions with him all at the same time.

3) Within CRM settings a user may wish to set his invoices to be sent out automatically in which case this microservice is called via CRON at required times.


This prototype effectively looks to solve these cases simply by using existing app on page html elements to generate email data on the fly from them when required.
