App.QueryField = Ext.extend(Ext.form.TwinTriggerField, {
	emptyText: 'Query'
	,trigger1Class: 'x-form-clear-trigger'
	,trigger2Class: 'x-form-search-trigger'
	,validationEvent: false
	,validateOnBlur: false
	,hideTrigger1: true
	,width:300
	,initComponent: function(){
		this.addEvents('query');
		App.QueryField.superclass.initComponent.call(this);
		this.on('specialkey', function(f, e){
			if (e.getKey() == e.ENTER) {
				this.onTrigger2Click();
			}
		}, this);
	}
	,onTrigger1Click: function(){
		this.el.dom.value = '';
		this.triggers[0].hide();
		this.focus();
	}
	,onTrigger2Click: function(){
		var v = this.getRawValue();
		var l = v.length;
		if (l < 1) {
			this.onTrigger1Click();
			return;
		}
		this.fireEvent('query', v);
		this.triggers[0].show();
	}
});

Ext.reg('app.queryfield', App.QueryField);

