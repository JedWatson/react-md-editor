var classNames = require('classnames');
var CM = require('codemirror');
var React = require('react');

require('codemirror/mode/xml/xml');
require('codemirror/mode/markdown/markdown');
require('codemirror/addon/edit/continuelist');

function getCursorState(cm, pos) {
	pos = pos || cm.getCursor('start');
	var cs = {};
	var token = cm.getTokenAt(pos);
	if (!token.type) return cs;
	var tokens = token.type.split(' ');
	// console.log('tokens:');
	// console.log(tokens);
	tokens.forEach((t) => {
		switch (t) {
			case 'header-1':
				cs.h1 = true;
			break;
			case 'header-2':
				cs.h2 = true;
			break;
			case 'header-3':
				cs.h3 = true;
			break;
			case 'strong':
				cs.bold = true;
			break;
			case 'quote':
				cs.quote = true;
			break;
			case 'em':
				cs.italic = true;
			break;
			case 'link':
				cs.link = true;
				cs.link_label = true;
			break;
			case 'string':
				cs.link = true;
				cs.link_href = true;
			break;
			case 'variable-2':
				var text = cm.getLine(pos.line);
				if (/^\s*\d+\.\s/.test(text)) {
					cs.oList = true;
				} else {
					cs.uList = true;
				}
			break;
		}
	});
	// console.log('cursor state:');
	// console.log(Object.keys(cs));
	return cs;
}

var MarkdownEditor = React.createClass({
	
	getInitialState: function() {
		return {
			isFocused: false,
			cs: {}
		};
	},
	
	componentDidMount: function() {
		this.codeMirror = CM.fromTextArea(this.refs.codemirror.getDOMNode(), this.getOptions());
		this.codeMirror.on('change', this.codemirrorValueChanged);
		this.codeMirror.on('focus', this.focusChanged.bind(this, true));
		this.codeMirror.on('blur', this.focusChanged.bind(this, false));
		this.codeMirror.on('cursorActivity', this.updateCursorState);
		this._currentCodemirrorValue = this.props.value;
	},

	getOptions: function() {
		return Object.assign({
			mode: 'markdown',
			lineNumbers: false,
			indentWithTabs: true,
			tabSize: '2'
		}, this.props.options);
	},
	
	componentWillUnmount: function() {
		// todo: is there a lighter-weight way to remove the cm instance?
		if (this.codeMirror) {
			this.codeMirror.toTextArea();
		}
	},
	
	componentWillReceiveProps: function(nextProps) {
		if (this.codeMirror && this._currentCodemirrorValue !== nextProps.value) {
			this.codeMirror.setValue(nextProps.value);
		}
	},

	getCodeMirror: function() {
		return this.codeMirror;
	},
	
	focus: function() {
		if (this.codeMirror) {
			this.codeMirror.focus();
		}
	},
	
	focusChanged: function(focused) {
		this.setState({
			isFocused: focused
		});
	},

	updateCursorState: function() {
		this.setState({ cs: getCursorState(this.codeMirror) });
	},
	
	codemirrorValueChanged: function(doc, change) {
		var newValue = doc.getValue();
		this._currentCodemirrorValue = newValue;
		this.props.onChange && this.props.onChange(newValue);
	},

	fieldValueChanged: function(e) {
		// console.log("field changed");
	},

	toggle: function(csKey) {

	},

	renderButton: function(csKey, label) {
		var className = classNames('MDEditor_toolbarButton', { 'MDEditor_toolbarButton--pressed': this.state.cs[csKey] });
		return <div className={className} onClick={this.toggle.bind(this, csKey)}>{label}</div>;
	},

	renderToolbar: function() {
		return (
			<div className="MDEditor_toolbar">
				{this.renderButton('h1', 'h1')}
				{this.renderButton('h2', 'h2')}
				{this.renderButton('h3', 'h3')}
				{this.renderButton('bold', 'b')}
				{this.renderButton('italic', 'i')}
				{this.renderButton('oList', 'ol')}
				{this.renderButton('uList', 'ul')}
				{this.renderButton('quote', 'q')}
				{this.renderButton('link', 'a')}
			</div>
		);
	},
	
	render: function() {
		var editorClassName = 'MDEditor_editor';
		if (this.state.isFocused) {
			editorClassName += ' MDEditor_editor--focused';
		}
		return (
			<div className="MDEditor">
				{this.renderToolbar()}
				<div className={editorClassName}>
					<textarea ref="codemirror" name={this.props.path} value={this.props.value} onChange={this.fieldValueChanged} autoComplete="off" />
				</div>
			</div>
		);
	}
	
});

module.exports = MarkdownEditor;
