App.LoginWindow = Ext.extend(Ext.Window, {
	title: 'Login'
	,modal: true
	,center: true
	,border: false
	,draggable: false
	,resizable: false
	,width: 250
	,height: 150
	,layout: 'fit'
	,initComponent: function(){
		this.items = [{
			xtype: 'form'
			,labelAlign: 'right'
			,labelWidth: 75
			,frame: true
			,url: App.Config.base_remote + 'login'
			,defaultType: 'textfield'
			,defaults: {
				allowBlank: false
				,anchor: '-5'
				,listeners: {
					scope: this
					,specialkey: function(field, e) {
						if (e.getKey() === e.ENTER) {
							this.login();
						}
					}
				}
			}
			,items: [
				{fieldLabel: 'Username', name: 'username'}
				,{inputType: 'password', fieldLabel: 'Password', name: 'password'}
			]
		}];
		this.buttons = [
			{text: 'Login', handler: this.login, scope: this}
			,{text: 'Logout', handler: this.logout, scope: this}
		]
		App.LoginWindow.superclass.initComponent.call(this);
	}
	,login: function() {
		loginWindow = this;
		form = loginWindow.get(0).getForm();
		if (form.isValid()) {
			loginWindow.el.mask('Please wait...', 'x-mask-loading');
			form.submit({
				success: function(r, o){loginWindow.el.unmask();loginWindow.fireEvent('logged', form.findField('username').getValue());}
				,failure: function(r, o){loginWindow.el.unmask();Ext.Msg.alert('Failed', 'Something wrong happend');}
			});

		}
	}
	,logout: function() {
		loginWindow = this;
		loginWindow.el.mask('Please wait...', 'x-mask-loading');
		Ext.Ajax.request({
			url: App.Config.base_remote + 'logout'
			,method: 'post'
			,success: function(){loginWindow.el.unmask();loginWindow.fireEvent('logged', 'Anonymous');}
		});
	}
});

Ext.reg('app.loginwindow', App.LoginWindow);

