var classNames = require('classnames');
var CM = require('codemirror');
var React = require('react');
var ReactDOM = require('react-dom');
var Icons = require('./icons');

require('codemirror/mode/xml/xml');
require('codemirror/mode/markdown/markdown');
require('codemirror/addon/edit/continuelist');

import { getCursorState, applyFormat } from './format.js';

var MarkdownEditor = React.createClass({

	propTypes: {
		onChange: React.PropTypes.func,
		options: React.PropTypes.object,
		path: React.PropTypes.string,
		value: React.PropTypes.string,
	},

	getInitialState () {
		return {
			isFocused: false,
			cs: {},
		};
	},

	componentDidMount () {
		this.codeMirror = CM.fromTextArea(ReactDOM.findDOMNode(this.refs.codemirror), this.getOptions());
		this.codeMirror.on('change', this.codemirrorValueChanged);
		this.codeMirror.on('focus', this.focusChanged.bind(this, true));
		this.codeMirror.on('blur', this.focusChanged.bind(this, false));
		this.codeMirror.on('cursorActivity', this.updateCursorState);
		this._currentCodemirrorValue = this.props.value;
	},

	getOptions () {
		return Object.assign({
			mode: 'markdown',
			lineNumbers: false,
			indentWithTabs: true,
			tabSize: '2',
		}, this.props.options);
	},

	componentWillUnmount () {
		// todo: is there a lighter-weight way to remove the cm instance?
		if (this.codeMirror) {
			this.codeMirror.toTextArea();
		}
	},

	componentWillReceiveProps (nextProps) {
		if (this.codeMirror && this._currentCodemirrorValue !== nextProps.value) {
			this.codeMirror.setValue(nextProps.value);
		}
	},

	getCodeMirror () {
		return this.codeMirror;
	},

	focus () {
		if (this.codeMirror) {
			this.codeMirror.focus();
		}
	},

	focusChanged (focused) {
		this.setState({ isFocused: focused });
	},

	updateCursorState () {
		this.setState({ cs: getCursorState(this.codeMirror) });
	},

	codemirrorValueChanged (doc, change) {
		var newValue = doc.getValue();
		this._currentCodemirrorValue = newValue;
		this.props.onChange && this.props.onChange(newValue);
	},

	toggleFormat (formatKey, e) {
		e.preventDefault();
		applyFormat(this.codeMirror, formatKey);
	},

	renderIcon (icon) {
		return <span dangerouslySetInnerHTML={{__html: icon}} className="MDEditor_toolbarButton_icon" />;
	},

	renderButton (formatKey, label, action) {
		if (!action) action = this.toggleFormat.bind(this, formatKey);

		var isTextIcon = (formatKey === 'h1' || formatKey === 'h2' || formatKey === 'h3');
		var className = classNames('MDEditor_toolbarButton', {
			'MDEditor_toolbarButton--pressed': this.state.cs[formatKey]
		}, ('MDEditor_toolbarButton--' + formatKey));

		var labelClass = isTextIcon ? 'MDEditor_toolbarButton_label-icon' : 'MDEditor_toolbarButton_label';

		return (
			<button className={className} onClick={action} title={formatKey}>
				{isTextIcon ? null : this.renderIcon(Icons[formatKey])}
				<span className={labelClass}>{label}</span>
			</button>
		);
	},

	renderToolbar () {
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
				{/*this.renderButton('link', 'a')*/}
			</div>
		);
	},

	render () {
		var editorClassName = classNames('MDEditor_editor', { 'MDEditor_editor--focused': this.state.isFocused });
		return (
			<div className="MDEditor">
				{this.renderToolbar()}
				<div className={editorClassName}>
					<textarea ref="codemirror" name={this.props.path} defaultValue={this.props.value} autoComplete="off" />
				</div>
			</div>
		);
	}

});

export default MarkdownEditor;
