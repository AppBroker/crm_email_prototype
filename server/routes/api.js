
var ES = require('./email-settings'),
    AS = require('./app-settings'),
    juice = require('juice'),
    XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest,
    webshot = require('webshot'),
    aasync = require("async"),
    fs      = require('fs'),
    driver = require('node-phantom-simple'),
	EM = {};
	
//Webshot invoice URL options
var soptions = {
  windowSize: { width: ES.email_width, height: ES.email_height },
  shotSize: { width: 'window', height: 'window' },
  phantomPath: AS.phantompath,
  siteType:'html'
};

//Webshot logo options
var xoptions = {
  windowSize: { width: ES.logo_width, height: ES.logo_height },
  shotSize: { width: 'window', height: 'window' },
  phantomPath: AS.phantompath
};

/**
	This method is called when a user on the CRM decides he wants to send out invoices to all his clients, 
	similar process to method below but takes a list of the users clients that have outstanding balances, 
	uses the headless browser to browse the invoice generator back on the CRM that then creates the outstanding 
	invoice on the fly, creates a PDF from it combining inlined html and binary logo data and attaches 
	it for php to send on.
**/
exports.invoiceAll = function (req, res) {
	var manageraccount = req.body;
	var urlArr = EM.buildInvoiceLinks(manageraccount);

    driver.create({ path: AS.phantompath }, function (err, browser) {  
        var tests = urlArr.map(function(aObj){

            return function(callback){

              return browser.createPage(function (err, page) {
                return page.open(aObj.pdfURL, function (err,status) {
                    
                var accountCustomer = aObj.customerAccount;

                  page.includeJs(ES.phantomJQuery, function (err) {
                    // jQuery Loaded.
                    // This will defo need re-factoring at some point when I get some additional hands on deck, not urgent for now basis is that it works
                    setTimeout(function () {

                      return page.evaluate(function () {
                        //Grab the Angular invoice-template directive
                        var invoiceArr = [];
                        $('invoice-template').each(function () { invoiceArr.push($(this).html()); });

                        return {
                          invoiceItems: invoiceArr
                        };
                      }, function (err,result) {

                          var emailbody = result.invoiceItems[0];

                            //Client backlink to invoice
                            var nhtml = "<html>";
                                nhtml += aObj.notificationLink;
                                nhtml += "</html>";

                            //Actual invoice HTML
                            var bhtml = "<html>";
                                bhtml += ES.cssLinks;
                                bhtml += emailbody;
                                bhtml += "</html>";

                            juice.juiceResources(bhtml, {url:AS.appurl}, function(err, html ) {       

                                var logobinarydata = "";
								var xhr = EM.newXHR(req, res);
								var logo_path = EM.getLogoPath(manageraccount);
								
                                webshot(logo_path, xoptions, function(err, renderLogoStream) {
                                    renderLogoStream.on('data', function(datax) {
										logobinarydata += datax.toString('base64');
                                    });

                                    renderLogoStream.on('end', function() {
                                        var mailOptions = {
                                            from: ES.main_email, // sender address
                                            email: accountCustomer.email, 
                                            to: accountCustomer.email, // list of receivers
                                            host: ES.host,
                                            user: ES.user,
                                            pass: ES.password,
                                            clientlogo:logobinarydata,
                                            subject      : ES.emailSubject + accountCustomer.manager + ' - ' + manageraccount.date, // Subject line
                                            text         : ES.emailSubject, // plaintext body
                                            html: nhtml, 
                                            htmlbody: bhtml
                                        };
                                        //Send Email
                                        xhr.send(JSON.stringify(mailOptions));
                                    })
                                });
  
                                //---
                                function err(){
                                 //Console err   
                                    console.log("There has been an error sending mail");
									res.json({ status: false });
                                }
                            })//end juice
                      });
                    }, ES.jQueryTimeOut);//end timeout
                  });//end includeJs
                 });//end page open
              });
            };//end callback
        });//end tests
        aasync.series(tests, function(err, results){
            console.log("Finishing" + results);
            browser.exit();
            //Call this last finally to tell the app we are done
            res.json({ status: true });
        });
    });//end driver
    
    function err(){
     //Console err   
        console.log("There has been an error sending mail")
		res.json({ status: false });
    }    	   
};

/**
	This method, besides just sending emails also takes a screenshot of whatever html 
	is passed to it and then sends an attachment by firing up a headless browser using 
	whatever html is passed to it from the site capturing the binary data and making it 
	ready to convert to PDF or any other attachment format. This means that a user can 
	make whatever changes to their invoice template on the client side and we dont need 
	to make additional calls to the db, or wory about having to save the states to rebuild 
	the invoice after the fact. The user only needs to create their invoice once on the 
	SAAS tool/invoice page on the site and we can then wrap the html from that edited invoice 
	image up in whatever format we want after that converting it to pdf png, jpeg etc. 
	There is no need to create additional views or designs for invoices. 
	In a nutshell it just grabs an html page at that point in time and sends an email 
	representation attachment of it as a png or pdf. It also converts the css to 
	inline styling for use within an email client.
**/
exports.sendInvoice = function (req, res) {
    var account = req.body;
	
	var clientInvoiceLink = EM.composeClientInvoiceLink(account.manager, AS.appurl, account.customerId, account.invoiceId, account.iToken, account.invoice_card_payments);
	
	var emailbody = account.emailBody;
    
    //Client backlink to invoice
	var nhtml = "<html>";
        nhtml += clientInvoiceLink;
		nhtml += "</html>";
    
    //Begin invoice HTML
	var bhtml = "<html>";
        bhtml += ES.cssLinks;
        bhtml += emailbody;
		bhtml += "</html>";
		
    var xhr = EM.newXHR(req, res);
	
    juice.juiceResources(bhtml, {url:AS.appurl}, function(err, html ) {    
 
        var logobinarydata = "";
		
		var logo_path = EM.getLogoPath(account.logo_path);
          
            webshot(logo_path, xoptions, function(err, renderLogoStream) {
                renderLogoStream.on('data', function(datax) {
                    logobinarydata += datax.toString('base64');
                });
                    
                renderLogoStream.on('end', function() {
                    var mailOptions = {
                        from: ES.main_email, // sender address
                        to: account.email, // list of receivers
                        host: ES.host,
                        user: ES.user,
                        pass: ES.password,
                        clientlogo:logobinarydata,
                        subject      : ES.emailSubject + account.manager + ' - ' + account.date, // Subject line
                        text         : ES.emailSubject , // plaintext body
                        html: nhtml, // html body
                        htmlbody: bhtml // html body
                      };
                      //Send Email
					xhr.send(JSON.stringify(mailOptions));
                })
            });
        //---
    
        function err(){
         //Console err   
            console.log("There has been an error sending mail")
        }
    })
};

EM.getLogoPath = function(acc){
	var lpath = acc.logo_path ? acc.logo_path : ES.defaultLogoPath;
	return lpath;
}

EM.newXHR = function(req, res){
	var xhr = new XMLHttpRequest();
    xhr.open("POST",ES.sendmail,true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        if (xhr.status === 200) {
            console.log("Email sent to : " + xhr.responseText);
            res.json({ status: true });
        }else{
            console.log("Error sending email : " + xhr.responseText);
			res.json({ status: false });
        }
    };
	return xhr;
}

/** Prep email invoice backlinks based on a users client base, 
Set up the urls for the invoices that you want to turn into PDF 
**/
EM.buildInvoiceLinks = function(manager_account){
	var useCardPayments = manager_account.invoice_card_payments;
	var accounts = manager_account.customersArr;
	var urlArr = [];

    for(var i=0;i<accounts.length;i++){
        var account = accounts[i];
		var asyncObj = {};
        var invoiceIndex = account.invoice_ref;	
		var clientInvoiceLink = EM.composeClientInvoiceLink(account.manager, AS.appurl, account.id, invoiceIndex, account.token, useCardPayments);
        var pdf_url = AS.appurl + ES.externalInvoicePath + account.id + '/' + invoiceIndex + '/' + account.token + ES.externalLogoParam;
		
		asyncObj.notificationLink = clientInvoiceLink;
		asyncObj.pdfURL = pdf_url;
		asyncObj.customerAccount = account;
		
        urlArr.push(asyncObj);
    }
	
	return urlArr;
}

/** Compose linkback to invoice for manual and card payments **/
EM.composeClientInvoiceLink = function(acc_manager, app_url, acc_id, inv_index, acc_token, card_payments)
{
	var html = '';

	if(card_payments){
			html = '<body><p>Your latest invoice from ' + acc_manager + ' is available.</p><p><a href="' + app_url + ES.externalInvoicePath + acc_id + '/' + inv_index + '/' + acc_token + '" target="_blank">To view this invoice online or download another pdf copy follow this link.</a></p></body>';
	}else{
			html = '<body><p>Your latest invoice from ' + acc_manager + ' is available.</p><p><a href="' + app_url + ES.externalInvoicePath + acc_id + '/' + inv_index + '/' + acc_token + '" target="_blank">To view this invoice online or download a pdf copy follow this link.</a></p><p><a href="' + app_url + ES.paidNotificationPath + acc_id + '/' + inv_index + '/' + acc_token + '" style="color: #ffffff;background-color: #428bca;border-color: #357ebd;display: inline-block;padding: 6px 12px;margin-bottom: 0;font-size: 14px;font-weight: normal;line-height: 1.428571429;text-align: center;white-space: nowrap;vertical-align: middle;cursor: pointer;background-image: none;border: 1px solid transparent;border-radius: 4px;-webkit-user-select: none;">Click here to notify ' + acc_manager + ' once you have paid this invoice.</a></p></body>';
		}

	return html;
}

