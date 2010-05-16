App.Login = Ext.extend(Ext.Button, {
	text: 'Logged as: ' + App.Config.username
	,initComponent: function(){
		this.handler = this.onClick;
		App.Login.superclass.initComponent.call(this);
	}
	,onClick: function(a){
		var username = window.prompt("Username");
		var password = window.prompt("Password");
		Ext.Ajax.request({
			url: '/remote/login'
			,params: {username: username, password: password}
			,success: function(r, o){Ext.Msg.alert('Login', 'You are now logged');}
			,failure: function(r, o){Ext.Msg.alert('Failed', 'Something wrong happend');}
		});
	}
});

Ext.reg('app.login', App.Login);

