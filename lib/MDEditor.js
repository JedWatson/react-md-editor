'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _formatJs = require('./format.js');

var classNames = require('classnames');
var CM = require('codemirror');
var React = require('react');
var ReactDOM = require('react-dom');
var Icons = require('./icons');

require('codemirror/mode/xml/xml');
require('codemirror/mode/markdown/markdown');
require('codemirror/addon/edit/continuelist');

var MarkdownEditor = React.createClass({
	displayName: 'MarkdownEditor',

	propTypes: {
		onChange: React.PropTypes.func,
		options: React.PropTypes.object,
		path: React.PropTypes.string,
		value: React.PropTypes.string
	},

	getInitialState: function getInitialState() {
		return {
			isFocused: false,
			cs: {}
		};
	},

	componentDidMount: function componentDidMount() {
		this.codeMirror = CM.fromTextArea(ReactDOM.findDOMNode(this.refs.codemirror), this.getOptions());
		this.codeMirror.on('change', this.codemirrorValueChanged);
		this.codeMirror.on('focus', this.focusChanged.bind(this, true));
		this.codeMirror.on('blur', this.focusChanged.bind(this, false));
		this.codeMirror.on('cursorActivity', this.updateCursorState);
		this._currentCodemirrorValue = this.props.value;
	},

	getOptions: function getOptions() {
		return _extends({
			mode: 'markdown',
			lineNumbers: false,
			indentWithTabs: true,
			tabSize: '2'
		}, this.props.options);
	},

	componentWillUnmount: function componentWillUnmount() {
		// todo: is there a lighter-weight way to remove the cm instance?
		if (this.codeMirror) {
			this.codeMirror.toTextArea();
		}
	},

	componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
		if (this.codeMirror && this._currentCodemirrorValue !== nextProps.value) {
			this.codeMirror.setValue(nextProps.value);
		}
	},

	getCodeMirror: function getCodeMirror() {
		return this.codeMirror;
	},

	focus: function focus() {
		if (this.codeMirror) {
			this.codeMirror.focus();
		}
	},

	focusChanged: function focusChanged(focused) {
		this.setState({ isFocused: focused });
	},

	updateCursorState: function updateCursorState() {
		this.setState({ cs: (0, _formatJs.getCursorState)(this.codeMirror) });
	},

	codemirrorValueChanged: function codemirrorValueChanged(doc, change) {
		var newValue = doc.getValue();
		this._currentCodemirrorValue = newValue;
		this.props.onChange && this.props.onChange(newValue);
	},

	toggleFormat: function toggleFormat(formatKey, e) {
		e.preventDefault();
		(0, _formatJs.applyFormat)(this.codeMirror, formatKey);
	},

	renderIcon: function renderIcon(icon) {
		return React.createElement('span', { dangerouslySetInnerHTML: { __html: icon }, className: 'MDEditor_toolbarButton_icon' });
	},

	renderButton: function renderButton(formatKey, label, action) {
		if (!action) action = this.toggleFormat.bind(this, formatKey);

		var isTextIcon = formatKey === 'h1' || formatKey === 'h2' || formatKey === 'h3';
		var className = classNames('MDEditor_toolbarButton', {
			'MDEditor_toolbarButton--pressed': this.state.cs[formatKey]
		}, 'MDEditor_toolbarButton--' + formatKey);

		var labelClass = isTextIcon ? 'MDEditor_toolbarButton_label-icon' : 'MDEditor_toolbarButton_label';

		return React.createElement(
			'button',
			{ className: className, onClick: action, title: formatKey },
			isTextIcon ? null : this.renderIcon(Icons[formatKey]),
			React.createElement(
				'span',
				{ className: labelClass },
				label
			)
		);
	},

	renderToolbar: function renderToolbar() {
		return React.createElement(
			'div',
			{ className: 'MDEditor_toolbar' },
			this.renderButton('h1', 'h1'),
			this.renderButton('h2', 'h2'),
			this.renderButton('h3', 'h3'),
			this.renderButton('bold', 'b'),
			this.renderButton('italic', 'i'),
			this.renderButton('oList', 'ol'),
			this.renderButton('uList', 'ul'),
			this.renderButton('quote', 'q')
		);
	},

	render: function render() {
		var editorClassName = classNames('MDEditor_editor', { 'MDEditor_editor--focused': this.state.isFocused });
		return React.createElement(
			'div',
			{ className: 'MDEditor' },
			this.renderToolbar(),
			React.createElement(
				'div',
				{ className: editorClassName },
				React.createElement('textarea', { ref: 'codemirror', name: this.props.path, defaultValue: this.props.value, autoComplete: 'off' })
			)
		);
	}

});

exports['default'] = MarkdownEditor;
module.exports = exports['default'];
/*this.renderButton('link', 'a')*/