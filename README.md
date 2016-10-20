Invoicing Clients - HTML Elements to PDF Via Email or Notification Prototype( PHP, Node, Express )
==================================================================================================
As a front end developer the idea of creating this microservice prototype came to me when I identified the case for reducing the amount of boiler plate code it would've have taken to generate views and controllers within angular on the invoicing particulars for my users clients within my CRM and invoicing system. I wanted to make sure that the PDF's replicas(of on page html) being sent were exactly as the user had edited them on the front end SAAS tool when creating their invoices from the front end component. I decided that if I had already built views for these and users were browsing them anyway while editing then these same view elements and pages could be used to generate the corresponding emails, invoices, PDF attachments and mobile based notifications respectively.

I also wanted to seperate any resource intensive email methods away from the main app server for natural performance related reasons hence this service spins up its own node server and is accessed through the main app via an API call.
	
The code in future could also serve as a mechanism whereby it could convert any piece of html/imagery from the system into binary data and inlined html and then into any other format(jpg, png, pdf) from there to be used specifically in email.
I combined a few dependencies, phantomjs, juice and webshot to make it all work. It works alongside PHPMailer and TCPDF in a PHP class also acting as my mailer.

So far I have tested the "emailAll" functionality firing with success on 500 client emails at once with 100 concurrent users. 

Please note the code is stable however still very much a work in progress.
	
To get an idea - There are 3 separate occasions that my users may request to send invoices to their clients within the system.
	
1) By viewing a clients account selecting outstanding transactions and creating an invoice on the fly and sending directly from that particular created invoice.

2) On the users dashboard for time saving purposes use a user may want to invoice all his clients that have outstanding transactions with him all at the same time.

3) Within CRM settings a user may wish to set his invoices to be sent out automatically ( monthly or weekly ) in which case this microservice is called via CRON at the required times.


This prototype effectively looks to solve these cases by simply grabbing and copying rendered on page html invoice element code in order to generate email data on the fly from them when required.
