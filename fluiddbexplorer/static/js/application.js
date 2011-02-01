if (typeof console == "undefined") var console = { log: function() {} };
Ext.BLANK_IMAGE_URL = '/static/extjs/resources/images/default/s.gif';

Ext.onReady(function() {
	Ext.QuickTips.init();

	sidePanel = new App.NamespacesTree();

	var queryId = Ext.id();
	var loginId = Ext.id();
	mainPanel = new App.MainPanel({id: 'mainpanel'});

	var viewport_config = {
		layout: 'border'
		,items: [{
			border: false
			,cls: 'header'
			,layout: 'hbox'
			,layoutConfig: {align: 'stretch'}
			,defaults: {margins: '5 5 5 0'}
			,region: 'north'
			,height: 30
			,items: [
				{xtype: 'box', el: 'logo', border: false}
				,{border: false, flex: 1}
				,{xtype: 'app.queryfield', id: queryId}
				,{xtype: 'app.login', id: loginId}
			]
			}
		]
	};

	if (App.Config.rootid != 'nstree-disabled') {
		viewport_config.items.push({region: 'center', border: true, margins: '5 5 5 0', layout: 'fit', items: mainPanel});
		viewport_config.items.push({region: 'west', border: true, margins: '5 0 5 5', collapsible: true, collapseMode: 'mini', hideCollapseTool:true, split: true, minSize: 100, maxSize: 400, width: 240, layout: 'fit', items: sidePanel});
	}
	else {
		viewport_config.items.push({region: 'center', border: true, margins: '5 5 5 5', layout: 'fit', items: mainPanel});
	}


	var viewport = new Ext.Viewport(viewport_config);

	var query = Ext.getCmp(queryId);
	var login = Ext.getCmp(loginId);

	function openResultsGrid(query) {
		var id = Ext.util.base64.encode('resultsgrid-' + query);
		var t = Ext.getCmp(id);
		if (!t) {
			t = new App.ResultsGrid({id: id, query: query});
			mainPanel.addTab(t);
		}
		mainPanel.setActiveTab(t);
	}

	var lastTag = '';
	sidePanel.on('tagclick', function(t){
		openResultsGrid('has ' + t);
	});

	sidePanel.on('permission', function(path, type){
		var id = Ext.util.base64.encode('permissionspanel-' + type + '-' + path);
		var t = Ext.getCmp(id);
		if (!t) {
			t = new App.PermissionsPanel({id: id, type: type, path: path});
			mainPanel.addTab(t);
		}
		mainPanel.setActiveTab(t);
	});

	sidePanel.on('openobject', function(path, type){
		if (type == 'ns') {
			abouttag = 'Object for the namespace ' + path;
		}
		else {
			abouttag = 'Object for the attribute ' + path;
		}

		direct.AboutToID(abouttag, function(oid){
			Ext.getCmp('mainpanel').openObject(oid);
		});
	});

	query.on('query', function(q){
		openResultsGrid(q);
	});

	Ext.Msg.minWidth = 300;
	Ext.Ajax.on('requestexception', function(conn, response, options){
		json = Ext.util.JSON.decode(response.responseText);
		Ext.Msg.alert('Error from FluidDB', json.msg);
	});

	Ext.Direct.on('exception', function(e){
		var msg = e.message.replace(/</g, "&lt;");
		Ext.Msg.alert('Error from FluidDB', msg);
	});
});

Ext.util.base64 = {

    base64s : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",

    encode: function(decStr){
        if (typeof btoa === 'function') {
             return btoa(decStr);
        }
        var base64s = this.base64s;
        var bits;
        var dual;
        var i = 0;
        var encOut = "";
        while(decStr.length >= i + 3){
            bits = (decStr.charCodeAt(i++) & 0xff) <<16 | (decStr.charCodeAt(i++) & 0xff) <<8 | decStr.charCodeAt(i++) & 0xff;
            encOut += base64s.charAt((bits & 0x00fc0000) >>18) + base64s.charAt((bits & 0x0003f000) >>12) + base64s.charAt((bits & 0x00000fc0) >> 6) + base64s.charAt((bits & 0x0000003f));
        }
        if(decStr.length -i > 0 && decStr.length -i < 3){
            dual = Boolean(decStr.length -i -1);
            bits = ((decStr.charCodeAt(i++) & 0xff) <<16) |    (dual ? (decStr.charCodeAt(i) & 0xff) <<8 : 0);
            encOut += base64s.charAt((bits & 0x00fc0000) >>18) + base64s.charAt((bits & 0x0003f000) >>12) + (dual ? base64s.charAt((bits & 0x00000fc0) >>6) : '=') + '=';
        }
        return(encOut);
    },

    decode: function(encStr){
        if (typeof atob === 'function') {
            return atob(encStr);
        }
        var base64s = this.base64s;
        var bits;
        var decOut = "";
        var i = 0;
        for(; i<encStr.length; i += 4){
            bits = (base64s.indexOf(encStr.charAt(i)) & 0xff) <<18 | (base64s.indexOf(encStr.charAt(i +1)) & 0xff) <<12 | (base64s.indexOf(encStr.charAt(i +2)) & 0xff) << 6 | base64s.indexOf(encStr.charAt(i +3)) & 0xff;
            decOut += String.fromCharCode((bits & 0xff0000) >>16, (bits & 0xff00) >>8, bits & 0xff);
        }
        if(encStr.charCodeAt(i -2) == 61){
            return(decOut.substring(0, decOut.length -2));
        }
        else if(encStr.charCodeAt(i -1) == 61){
            return(decOut.substring(0, decOut.length -1));
        }
        else {
            return(decOut);
        }
    }

};
