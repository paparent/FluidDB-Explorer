App.PermissionsPanel = Ext.extend(Ext.Panel, {
	border: false
	,closable: true
	,layout: 'hbox'
	,defaults: {flex:1,height:500}
	,initComponent: function(){
		if (this.type == 'ns') {
			this.items = [
				 {xtype: 'app.permpanel', type:'ns-create', path: this.path}
				,{xtype: 'app.permpanel', type:'ns-update', path: this.path}
				,{xtype: 'app.permpanel', type:'ns-delete', path: this.path}
				,{xtype: 'app.permpanel', type:'ns-list', path: this.path}
			];
		}
		else {
			this.items = [
				 {xtype: 'app.permpanel', type:'tag-see', path: this.path}
				,{xtype: 'app.permpanel', type:'tag-create', path: this.path}
				,{xtype: 'app.permpanel', type:'tag-read', path: this.path}
				,{xtype: 'app.permpanel', type:'tag-delete', path: this.path}
			];
		}
		App.PermissionsPanel.superclass.initComponent.call(this);
		this.setTitle('Permission: ' + this.path);
	}
});

Ext.reg('app.permissionspanel', App.PermissionsPanel);

App.PermPanel = Ext.extend(Ext.Panel, {
	frame: true
	,autoHeight: true
	,initComponent: function(){
		this.infos = this.type.split('-');
		this.title = this.infos[1];

		this.policyEl = Ext.id();
		this.items = [
			{id:this.policyEl}
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
				var elp = Ext.getCmp(this.policyEl);
				elp.add({html:"Policy: " + perm.policy + "<br><br>Exceptions:<br>&nbsp;&nbsp;" + perm.exceptions.join('<br>&nbsp;&nbsp;')});
				elp.doLayout();
			}
			,scope:this
		});
	}
});

Ext.reg('app.permpanel', App.PermPanel);
