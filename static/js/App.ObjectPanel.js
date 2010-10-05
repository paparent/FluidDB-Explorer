App.ObjectPanel = Ext.extend(Ext.Panel, {
	border: false
	,iconCls: 'icon-tab-object'
	,closable: true
	,layout: 'vbox'
	,initComponent: function(){
		this.items = [
			{border:true,margins:"5 5 5 5",frame:true,layout:'fit',bodyStyle:'padding:5px;',html:"Object ID: " + this.oid}
			,new App.TagValuesGrid({oid: this.oid, flex: 1})
		];
		this.title = 'Object ' + this.oid.split('-')[0];
		this.tabTip = this.oid;

		App.ObjectPanel.superclass.initComponent.call(this);

	}
	,afterRender: function(){
		App.ObjectPanel.superclass.afterRender.apply(this, arguments);
		this.body.on('click', this.onClick, this);

		Ext.Ajax.request({
			url: App.Config.base_remote + 'gettagvalue'
			,params: {oid: this.oid, tag: "fluiddb/about"}
			,scope: this
			,success: function(a){
				txt = "Object ID: " + this.oid + "<br><br>About: " + a.responseText;
				txt += '<br><br><a href="http://abouttag.appspot.com/id/butterfly/'+this.oid+'" target="_blank">View visual representation</a>';
				this.items.items[0].update(txt);
				this.doLayout();
			}
		});
	}
	,onClick: function(e, target){
		if (target = e.getTarget('a', 3)) {
			e.stopEvent();
			win = new Ext.ux.ManagedIFrame.Window({frame:true,defaultSrc:target.href, width:800, height:500});
			win.show();
		}
	}

});

Ext.reg('app.objectpanel', App.ObjectPanel);

