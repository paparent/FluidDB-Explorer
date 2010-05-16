if (typeof console == "undefined") var console = { log: function() {} };
Ext.BLANK_IMAGE_URL = '/static/extjs/resources/images/default/s.gif';

Ext.onReady(function() {
	Ext.QuickTips.init();
	
	sidePanel = new App.NamespacesTree();

	var queryId = Ext.id();
	var loginId = Ext.id();
	mainPanel = new App.MainPanel({id: 'mainpanel'});

	var viewport = new Ext.Viewport({
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
			,{region: 'west', border: true, margins: '5 0 5 5', collapsible: true, collapseMode: 'mini', hideCollapseTool:true, split: true, minSize: 100, maxSize: 400, width: 240, layout: 'fit', items: sidePanel}
			,{region: 'center', border: true, margins: '5 5 5 0', layout: 'fit', items: mainPanel}
		]
	});

	var query = Ext.getCmp(queryId);
	var login = Ext.getCmp(loginId);

	var lastTag = '';
	sidePanel.on('tagclick', function(t){
		var grid = new App.ResultsGrid({query: 'has ' + t});
		mainPanel.addTab(grid);
	});

	query.on('query', function(q){
		var grid = new App.ResultsGrid({query: q});
		mainPanel.addTab(grid);
	});

});

