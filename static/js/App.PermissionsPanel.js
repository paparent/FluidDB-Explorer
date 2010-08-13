App.PermissionsPanel = Ext.extend(Ext.Panel, {
	border: false
	,closable: true
	,layout: 'hbox'
	,defaults: {flex:1,height:500}
	,initComponent: function(){
		var title;
		if (this.type == 'ns') {
			title = 'NS Permissions: ' + this.path;
			this.items = [
				 {xtype: 'app.permpanel', type:'ns-create', path: this.path}
				,{xtype: 'app.permpanel', type:'ns-update', path: this.path}
				,{xtype: 'app.permpanel', type:'ns-delete', path: this.path}
				,{xtype: 'app.permpanel', type:'ns-list', path: this.path}
			];
		}
		else {
			title = 'Tag Permissions: ' + this.path;
			this.items = [
				 {xtype: 'app.permpanel', type:'tag-see', path: this.path}
				,{xtype: 'app.permpanel', type:'tag-create', path: this.path}
				,{xtype: 'app.permpanel', type:'tag-read', path: this.path}
				,{xtype: 'app.permpanel', type:'tag-delete', path: this.path}
			];
		}
		App.PermissionsPanel.superclass.initComponent.call(this);
		this.setTitle(title);
	}
});

Ext.reg('app.permissionspanel', App.PermissionsPanel);

App.PermPanel = Ext.extend(Ext.Panel, {
	height: 400
	,initComponent: function(){
		this.infos = this.type.split('-');
		this.title = this.infos[1];

		this.storeExceptions = new Ext.data.ArrayStore({
			autoDestroy: true
			,expandData: true
			,fields: ['field1']
		});

		this.lvExceptions = new Ext.list.ListView({
			store: this.storeExceptions
			,multiSelect: true
			,emptyText: 'No exceptions'
			,columns: [{header: 'Exceptions', dataIndex: 'field1'}]		
		});

		this.policyEl = Ext.id();
		this.policy = null;

		this.items = [
			{id:this.policyEl}
			,this.lvExceptions
		];

		this.tbar = [
			{text:'Policy toggle', iconCls: 'icon-toggle', scope: this, handler: this.onPolicyToggle}
			,{xtype: 'tbtext', text:'Exceptions'}
			,{text:'add', iconCls: 'icon-add', scope: this, handler: this.onAddException}
			,{text:'delete', iconCls: 'icon-delete', scope: this, handler: this.onDeleteException}
			,'->'
			,{text:'Commit', iconCls: 'icon-commit', scope: this, handler: this.onCommit}
		];
		App.PermPanel.superclass.initComponent.call(this);
	}
	,afterRender: function() {
		App.PermPanel.superclass.afterRender.apply(this, arguments);

		this.doLoad();
	}
	,doLoad: function() {
		Ext.Ajax.request({
			url: '/remote/getperm'
			,params: {type: this.infos[0], action: this.infos[1], path: this.path}
			,success: function(a){
				var perm = Ext.util.JSON.decode(a.responseText);
				this.storeExceptions.loadData(perm.exceptions);
				var elp = Ext.getCmp(this.policyEl);
				elp.add({border:false,html:"Policy: " + perm.policy});
				elp.doLayout();
				this.policy = perm.policy;
			}
			,scope:this
		});
	}
	,onPolicyToggle: function() {
		if (this.policy == 'closed') this.policy = 'open';
		else this.policy = 'closed';
		var elp = Ext.getCmp(this.policyEl);
		elp.removeAll();
		elp.add({html:"Policy: " + this.policy});
		elp.doLayout();

	}
	,onDeleteException: function() {
		Ext.each(this.lvExceptions.getSelectedRecords(), function(r){this.storeExceptions.remove(r);}, this);

	}
	,onAddException: function() {
		username = window.prompt('Please enter a username');
		this.storeExceptions.loadData(new Array(username), true);
	}
	,onCommit: function() {
		this.exceptions = new Array();
		this.storeExceptions.each(function(r){this.exceptions.push(r.data.field1);}, this);
		Ext.Ajax.request({
			url: '/remote/setperm'
			,params: {type: this.infos[0], action: this.infos[1], path: this.path, policy: this.policy, exceptions: Ext.util.JSON.encode(this.exceptions)}
			,success: function(a){
			}
		});
	}
});

Ext.reg('app.permpanel', App.PermPanel);
