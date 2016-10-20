var express = require('express'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    errorhandler = require('errorhandler'),
    path = require('path'),
    api = require('./routes/api'),
    protectJSON = require('./lib/protectJSON'),
    requestIp = require('request-ip'),
    app = express();

    app.use(cookieParser());
    app.use(bodyParser.json({limit: '50mb'}));
    app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

    app.use(express.static(__dirname + '/../'));
    app.use(errorhandler());
    app.use(protectJSON);
    app.use(requestIp.mw());

    process.on('uncaughtException', function (err) {
        if (err) console.log(err, err.stack);
    });

    app.post('/dispatchinvoice', api.sendInvoice);
    app.post('/invoiceAll', api.invoiceAll);
	/*	
	//We could add all of these (below) in, but we only need to seperate the really intensive email processes (above) to this cluster.
	dispatch_reset_password_path : "/dispatchresetpassword",
	dispatch_trial_ending_path : "/dispatchtrialending",
	dispatch_trial_ended_success_path : "/dispatchtrialended",
	dispatch_trial_ended_fail_path : "/dispatchtrialendedfail",
	dispatch_activation_path : "/dispatchactivation",
	dispatch_invoice_path : "/dispatchinvoice",
	invoice_all_path : "/invoiceall"
	*/

    // redirect all others to the index
    app.get('*', function(req, res) {
        res.json({ emailServer: "Indeed." });
    });

    // Start server
    app.listen(process.env.PORT, function () {
        console.log("CRM Email Prototype Express Email Server listening on port %d in %s mode", this.address().port, app.settings.env);
    });
