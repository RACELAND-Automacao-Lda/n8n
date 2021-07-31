import {
	IContextObject,
	INode,
	INodeCredentialDescription,
	INodeExecutionData,
	INodeIssueObjectProperty,
	INodeIssues,
	INodeParameters,
	INodeProperties,
	INodePropertyCollection,
	INodeType,
	IParameterDependencies,
	IRunExecutionData,
	IWebhookData,
	IWorkflowExecuteAdditionalData,
	NodeParameterValue,
	WebhookHttpMethod,
} from './Interfaces';

import {
	Workflow
} from './Workflow';

import { get, isEqual } from 'lodash';



/**
 * Gets special parameters which should be added to nodeTypes depending
 * on their type or configuration
 *
 * @export
 * @param {INodeType} nodeType
 * @returns
 */
export function getSpecialNodeParameters(nodeType: INodeType) {
	if (nodeType.description.polling === true) {
		return [
			{
				displayName: 'Poll Times',
				name: 'pollTimes',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Poll Time',
				},
				default: {},
				description: 'Time at which polling should occur.',
				placeholder: 'Add Poll Time',
				options: [
					{
						name: 'item',
						displayName: 'Item',
						values: [
							{
								displayName: 'Mode',
								name: 'mode',
								type: 'options',
								options: [
									{
										name: 'Every Minute',
										value: 'everyMinute',
									},
									{
										name: 'Every Hour',
										value: 'everyHour',
									},
									{
										name: 'Every Day',
										value: 'everyDay',
									},
									{
										name: 'Every Week',
										value: 'everyWeek',
									},
									{
										name: 'Every Month',
										value: 'everyMonth',
									},
									{
										name: 'Every X',
										value: 'everyX',
									},
									{
										name: 'Custom',
										value: 'custom',
									},
								],
								default: 'everyDay',
								description: 'How often to trigger.',
							},
							{
								displayName: 'Hour',
								name: 'hour',
								type: 'number',
								typeOptions: {
									minValue: 0,
									maxValue: 23,
								},
								displayOptions: {
									hide: {
										mode: [
											'custom',
											'everyHour',
											'everyMinute',
											'everyX',
										],
									},
								},
								default: 14,
								description: 'The hour of the day to trigger (24h format).',
							},
							{
								displayName: 'Minute',
								name: 'minute',
								type: 'number',
								typeOptions: {
									minValue: 0,
									maxValue: 59,
								},
								displayOptions: {
									hide: {
										mode: [
											'custom',
											'everyMinute',
											'everyX',
										],
									},
								},
								default: 0,
								description: 'The minute of the day to trigger.',
							},
							{
								displayName: 'Day of Month',
								name: 'dayOfMonth',
								type: 'number',
								displayOptions: {
									show: {
										mode: [
											'everyMonth',
										],
									},
								},
								typeOptions: {
									minValue: 1,
									maxValue: 31,
								},
								default: 1,
								description: 'The day of the month to trigger.',
							},
							{
								displayName: 'Weekday',
								name: 'weekday',
								type: 'options',
								displayOptions: {
									show: {
										mode: [
											'everyWeek',
										],
									},
								},
								options: [
									{
										name: 'Monday',
										value: '1',
									},
									{
										name: 'Tuesday',
										value: '2',
									},
									{
										name: 'Wednesday',
										value: '3',
									},
									{
										name: 'Thursday',
										value: '4',
									},
									{
										name: 'Friday',
										value: '5',
									},
									{
										name: 'Saturday',
										value: '6',
									},
									{
										name: 'Sunday',
										value: '0',
									},
								],
								default: '1',
								description: 'The weekday to trigger.',
							},
							{
								displayName: 'Cron Expression',
								name: 'cronExpression',
								type: 'string',
								displayOptions: {
									show: {
										mode: [
											'custom',
										],
									},
								},
								default: '* * * * * *',
								description: 'Use custom cron expression. Values and ranges as follows:<ul><li>Seconds: 0-59</li><li>Minutes: 0 - 59</li><li>Hours: 0 - 23</li><li>Day of Month: 1 - 31</li><li>Months: 0 - 11 (Jan - Dec)</li><li>Day of Week: 0 - 6 (Sun - Sat)</li></ul>',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'number',
								typeOptions: {
									minValue: 0,
									maxValue: 1000,
								},
								displayOptions: {
									show: {
										mode: [
											'everyX',
										],
									},
								},
								default: 2,
								description: 'All how many X minutes/hours it should trigger.',
							},
							{
								displayName: 'Unit',
								name: 'unit',
								type: 'options',
								displayOptions: {
									show: {
										mode: [
											'everyX',
										],
									},
								},
								options: [
									{
										name: 'Minutes',
										value: 'minutes',
									},
									{
										name: 'Hours',
										value: 'hours',
									},
								],
								default: 'hours',
								description: 'If it should trigger all X minutes or hours.',
							},
						],
					},
				],
			},
		];
	}

	return [];
}


/**
 * Returns if the parameter should be displayed or not
 *
 * @export
 * @param {INodeParameters} nodeValues The data on the node which decides if the parameter
 *                                    should be displayed
 * @param {(INodeProperties | INodeCredentialDescription)} parameter The parameter to check if it should be displayed
 * @param {INodeParameters} [nodeValuesRoot] The root node-parameter-data
 * @returns
 */
export function displayParameter(nodeValues: INodeParameters, parameter: INodeProperties | INodeCredentialDescription, nodeValuesRoot?: INodeParameters) {
	if (!parameter.displayOptions) {
		return true;
	}

	nodeValuesRoot = nodeValuesRoot || nodeValues;

	let value;
	const values: any[] = []; // tslint:disable-line:no-any
	if (parameter.displayOptions.show) {
		// All the defined rules have to match to display parameter
		for (const propertyName of Object.keys(parameter.displayOptions.show)) {
			if (propertyName.charAt(0) === '/') {
				// Get the value from the root of the node
				value = get(nodeValuesRoot, propertyName.slice(1));
			} else {
				// Get the value from current level
				value = get(nodeValues, propertyName);
			}

			values.length = 0;
			if (!Array.isArray(value)) {
				values.push(value);
			} else {
				values.push.apply(values, value);
			}

			if (values.some(v => (typeof v) === 'string' && (v as string).charAt(0) === '=')) {
				return true;
			}

			if (values.length === 0 || !parameter.displayOptions.show[propertyName].some(v => values.includes(v))) {
				return false;
			}
		}
	}

	if (parameter.displayOptions.hide) {
		// Any of the defined hide rules have to match to hide the paramter
		for (const propertyName of Object.keys(parameter.displayOptions.hide)) {
			if (propertyName.charAt(0) === '/') {
				// Get the value from the root of the node
				value = get(nodeValuesRoot, propertyName.slice(1));
			} else {
				// Get the value from current level
				value = get(nodeValues, propertyName);
			}

			values.length = 0;
			if (!Array.isArray(value)) {
				values.push(value);
			} else {
				values.push.apply(values, value);
			}

			if (values.length !== 0 && parameter.displayOptions.hide[propertyName].some(v => values.includes(v))) {
				return false;
			}
		}
	}

	return true;
}


/**
 * Returns if the given parameter should be displayed or not considering the path
 * to the properties
 *
 * @export
 * @param {INodeParameters} nodeValues The data on the node which decides if the parameter
 *                                    should be displayed
 * @param {(INodeProperties | INodeCredentialDescription)} parameter The parameter to check if it should be displayed
 * @param {string} path The path to the property
 * @returns
 */
export function displayParameterPath(nodeValues: INodeParameters, parameter: INodeProperties | INodeCredentialDescription, path: string) {
	let resolvedNodeValues = nodeValues;
	if (path !== '') {
		resolvedNodeValues = get(
			nodeValues,
			path,
		) as INodeParameters;
	}

	// Get the root parameter data
	let nodeValuesRoot = nodeValues;
	if (path && path.split('.').indexOf('parameters') === 0) {
		nodeValuesRoot = get(
			nodeValues,
			'parameters',
		) as INodeParameters;
	}

	return displayParameter(resolvedNodeValues, parameter, nodeValuesRoot);
}


/**
 * Returns the context data
 *
 * @export
 * @param {IRunExecutionData} runExecutionData The run execution data
 * @param {string} type The data type. "node"/"flow"
 * @param {INode} [node] If type "node" is set the node to return the context of has to be supplied
 * @returns {IContextObject}
 */
export function getContext(runExecutionData: IRunExecutionData, type: string, node?: INode): IContextObject {
	if (runExecutionData.executionData === undefined) {
		// TODO: Should not happen leave it for test now
		throw new Error('The "executionData" is not initialized!');
	}

	let key: string;
	if (type === 'flow') {
		key = 'flow';
	} else if (type === 'node') {
		if (node === undefined) {
			throw new Error(`The request data of context type "node" the node parameter has to be set!`);
		}
		key = `node:${node.name}`;
	} else {
		throw new Error(`The context type "${type}" is not know. Only "flow" and node" are supported!`);
	}

	if (runExecutionData.executionData.contextData[key] === undefined) {
		runExecutionData.executionData.contextData[key] = {};
	}

	return runExecutionData.executionData.contextData[key];
}


/**
 * Returns which parameters are dependent on which
 *
 * @export
 * @param {INodeProperties[]} nodePropertiesArray
 * @returns {IParameterDependencies}
 */
export function getParamterDependencies(nodePropertiesArray: INodeProperties[]): IParameterDependencies {
	const dependencies: IParameterDependencies = {};

	let displayRule: string;
	let parameterName: string;
	for (const nodeProperties of nodePropertiesArray) {
		if (dependencies[nodeProperties.name] === undefined) {
			dependencies[nodeProperties.name] = [];
		}
		if (nodeProperties.displayOptions === undefined) {
			// Does not have any dependencies
			continue;
		}

		for (displayRule of Object.keys(nodeProperties.displayOptions)) {
			// @ts-ignore
			for (parameterName of Object.keys(nodeProperties.displayOptions[displayRule])) {
				if (!dependencies[nodeProperties.name].includes(parameterName)) {
					dependencies[nodeProperties.name].push(parameterName);
				}
			}
		}
	}

	return dependencies;
}


/**
 * Returns in which order the parameters should be resolved
 * to have the paramters available they are depent on
 *
 * @export
 * @param {INodeProperties[]} nodePropertiesArray
 * @param {IParameterDependencies} parameterDependencies
 * @returns {number[]}
 */
export function getParamterResolveOrder(nodePropertiesArray: INodeProperties[], parameterDependencies: IParameterDependencies): number[] {
	const executionOrder: number[] = [];
	const indexToResolve = Array.from({ length: nodePropertiesArray.length }, (v, k) => k);
	const resolvedParamters: string[] = [];

	let index: number;
	let property: INodeProperties;

	let lastIndexLength = indexToResolve.length;
	let lastIndexReduction = -1;

	let itterations = 0 ;

	while (indexToResolve.length !== 0) {
		itterations += 1;

		index = indexToResolve.shift() as number;
		property = nodePropertiesArray[index];

		if (parameterDependencies[property.name].length === 0) {
			// Does not have any dependencies so simply add
			executionOrder.push(index);
			resolvedParamters.push(property.name);
			continue;
		}

		// Parameter has dependencies
		for (const dependency of parameterDependencies[property.name]) {
			if (!resolvedParamters.includes(dependency)) {
				if (dependency.charAt(0) === '/') {
					// Assume that root level depenencies are resolved
					continue;
				}
				// Dependencies for that paramter are still missing so
				// try to add again later
				indexToResolve.push(index);
				continue;
			}
		}

		// All dependencies got found so add
		executionOrder.push(index);
		resolvedParamters.push(property.name);

		if (indexToResolve.length < lastIndexLength) {
			lastIndexReduction = itterations;
		}

		if (itterations > lastIndexReduction + nodePropertiesArray.length) {
			throw new Error('Could not resolve parameter depenencies. Max itterations got reached!');
		}
		lastIndexLength = indexToResolve.length;
	}

	return executionOrder;
}


/**
 * Returns the node parameter values. Depending on the settings it either just returns the none
 * default values or it applies all the default values.
 *
 * @export
 * @param {INodeProperties[]} nodePropertiesArray The properties which exist and their settings
 * @param {INodeParameters} nodeValues The node parameter data
 * @param {boolean} returnDefaults If default values get added or only none default values returned
 * @param {boolean} returnNoneDisplayed If also values which should not be displayed should be returned
 * @param {boolean} [onlySimpleTypes=false] If only simple types should be resolved
 * @param {boolean} [dataIsResolved=false] If nodeValues are already fully resolved (so that all default values got added already)
 * @param {INodeParameters} [nodeValuesRoot] The root node-parameter-data
 * @returns {(INodeParameters | null)}
 */
export function getNodeParameters(nodePropertiesArray: INodeProperties[], nodeValues: INodeParameters, returnDefaults: boolean, returnNoneDisplayed: boolean, onlySimpleTypes = false, dataIsResolved = false, nodeValuesRoot?: INodeParameters, parentType?: string, parameterDependencies?: IParameterDependencies): INodeParameters | null {
	if (parameterDependencies === undefined) {
		parameterDependencies = getParamterDependencies(nodePropertiesArray);
	}

	// Get the parameter names which get used multiple times as for this
	// ones we have to always check which ones get displayed and which ones not
	const duplicateParameterNames: string[] = [];
	const parameterNames: string[] = [];
	for (const nodeProperties of nodePropertiesArray) {
		if (parameterNames.includes(nodeProperties.name)) {
			if (!duplicateParameterNames.includes(nodeProperties.name)) {
				duplicateParameterNames.push(nodeProperties.name);
			}
		} else {
			parameterNames.push(nodeProperties.name);
		}
	}

	const nodeParameters: INodeParameters = {};
	const nodeParametersFull: INodeParameters = {};

	let nodeValuesDisplayCheck = nodeParametersFull;
	if (dataIsResolved !== true && returnNoneDisplayed === false) {
		nodeValuesDisplayCheck = getNodeParameters(nodePropertiesArray, nodeValues, true, true, true, true, nodeValuesRoot, parentType, parameterDependencies) as INodeParameters;
	}

	nodeValuesRoot = nodeValuesRoot || nodeValuesDisplayCheck;

	// Go through the parameters in order of their dependencies
	const parameterItterationOrderIndex = getParamterResolveOrder(nodePropertiesArray, parameterDependencies);

	for (const parameterIndex of parameterItterationOrderIndex) {
		const nodeProperties = nodePropertiesArray[parameterIndex];
		if (nodeValues[nodeProperties.name] === undefined && (returnDefaults === false || parentType === 'collection')) {
			// The value is not defined so go to the next
			continue;
		}

		if (returnNoneDisplayed === false && !displayParameter(nodeValuesDisplayCheck, nodeProperties, nodeValuesRoot)) {
			if (returnNoneDisplayed === false) {
				continue;
			}
			if (returnDefaults === false) {
				continue;
			}
		}

		if (!['collection', 'fixedCollection'].includes(nodeProperties.type)) {
			// Is a simple property so can be set as it is

			if (duplicateParameterNames.includes(nodeProperties.name)) {
				if (!displayParameter(nodeValuesDisplayCheck, nodeProperties, nodeValuesRoot)) {
					continue;
				}
			}

			if (returnDefaults === true) {
				// Set also when it has the default value
				if (['boolean', 'number', 'options'].includes(nodeProperties.type)) {
					// Boolean, numbers and options are special as false and 0 are valid values
					// and should not be replaced with default value
					nodeParameters[nodeProperties.name] = nodeValues[nodeProperties.name] !== undefined ? nodeValues[nodeProperties.name] : nodeProperties.default;
				} else {
					nodeParameters[nodeProperties.name] = nodeValues[nodeProperties.name] || nodeProperties.default;
				}
				nodeParametersFull[nodeProperties.name] = nodeParameters[nodeProperties.name];
			} else if ((nodeValues[nodeProperties.name] !== nodeProperties.default && typeof nodeValues[nodeProperties.name] !== 'object') ||
				(typeof nodeValues[nodeProperties.name] === 'object' && !isEqual(nodeValues[nodeProperties.name], nodeProperties.default)) ||
				(nodeValues[nodeProperties.name] !== undefined && parentType === 'collection')) {
				// Set only if it is different to the default value
				nodeParameters[nodeProperties.name] = nodeValues[nodeProperties.name];
				nodeParametersFull[nodeProperties.name] = nodeParameters[nodeProperties.name];
				continue;
			}
		}

		if (onlySimpleTypes === true) {
			// It is only supposed to resolve the simple types. So continue.
			continue;
		}

		// Is a complex property so check lower levels
		let tempValue: INodeParameters | null;
		if (nodeProperties.type === 'collection') {
			// Is collection

			if (nodeProperties.typeOptions !== undefined && nodeProperties.typeOptions.multipleValues === true) {
				// Multiple can be set so will be an array

				// Return directly the values like they are
				if (nodeValues[nodeProperties.name] !== undefined) {
					nodeParameters[nodeProperties.name] = nodeValues[nodeProperties.name];
				} else if (returnDefaults === true) {
					// Does not have values defined but defaults should be returned
					if (Array.isArray(nodeProperties.default)) {
						nodeParameters[nodeProperties.name] = JSON.parse(JSON.stringify(nodeProperties.default));
					} else {
						// As it is probably wrong for many nodes, do we keep on returning an empty array if
						// anything else than an array is set as default
						nodeParameters[nodeProperties.name] = [];
					}
				}
				nodeParametersFull[nodeProperties.name] = nodeParameters[nodeProperties.name];
			} else {
				if (nodeValues[nodeProperties.name] !== undefined) {
					// Has values defined so get them
					const tempNodeParameters = getNodeParameters(nodeProperties.options as INodeProperties[], nodeValues[nodeProperties.name] as INodeParameters, returnDefaults, returnNoneDisplayed, false, false, nodeValuesRoot, nodeProperties.type);

					if (tempNodeParameters !== null) {
						nodeParameters[nodeProperties.name] = tempNodeParameters;
						nodeParametersFull[nodeProperties.name] = nodeParameters[nodeProperties.name];
					}
				} else if (returnDefaults === true) {
					// Does not have values defined but defaults should be returned
					nodeParameters[nodeProperties.name] = JSON.parse(JSON.stringify(nodeProperties.default));
					nodeParametersFull[nodeProperties.name] = nodeParameters[nodeProperties.name];
				}
			}
		} else if (nodeProperties.type === 'fixedCollection') {
			// Is fixedCollection

			const collectionValues: INodeParameters = {};
			let tempNodeParameters: INodeParameters;
			let tempNodePropertiesArray: INodeProperties[];
			let nodePropertyOptions: INodePropertyCollection | undefined;

			let propertyValues = nodeValues[nodeProperties.name];
			if (returnDefaults === true) {
				if (propertyValues === undefined) {
					propertyValues = JSON.parse(JSON.stringify(nodeProperties.default));
				}
			}

			// Iterate over all collections
			for (const itemName of Object.keys(propertyValues || {})) {
				if (nodeProperties.typeOptions !== undefined && nodeProperties.typeOptions.multipleValues === true) {
					// Multiple can be set so will be an array

					const tempArrayValue: INodeParameters[] = [];
					// Iterate over all items as it contains multiple ones
					for (const nodeValue of (propertyValues as INodeParameters)[itemName] as INodeParameters[]) {
						nodePropertyOptions = nodeProperties!.options!.find((nodePropertyOptions) => nodePropertyOptions.name === itemName) as INodePropertyCollection;

						if (nodePropertyOptions === undefined) {
							throw new Error(`Could not find property option "${itemName}" for "${nodeProperties.name}"`);
						}

						tempNodePropertiesArray = (nodePropertyOptions as INodePropertyCollection).values!;
						tempValue = getNodeParameters(tempNodePropertiesArray, nodeValue as INodeParameters, returnDefaults, returnNoneDisplayed, false, false, nodeValuesRoot, nodeProperties.type);
						if (tempValue !== null) {
							tempArrayValue.push(tempValue);
						}
					}
					collectionValues[itemName] = tempArrayValue;
				} else {
					// Only one can be set so is an object of objects
					tempNodeParameters = {};

					// Get the options of the current item
					const nodePropertyOptions = nodeProperties!.options!.find((data) => data.name === itemName);

					if (nodePropertyOptions !== undefined) {
						tempNodePropertiesArray = (nodePropertyOptions as INodePropertyCollection).values!;
						tempValue = getNodeParameters(tempNodePropertiesArray, (nodeValues[nodeProperties.name] as INodeParameters)[itemName] as INodeParameters, returnDefaults, returnNoneDisplayed, false, false, nodeValuesRoot, nodeProperties.type);
						if (tempValue !== null) {
							Object.assign(tempNodeParameters, tempValue);
						}
					}

					if (Object.keys(tempNodeParameters).length !== 0) {
						collectionValues[itemName] = tempNodeParameters;
					}
				}
			}

			if (Object.keys(collectionValues).length !== 0 || returnDefaults === true) {
				// Set only if value got found

				if (returnDefaults === true) {
					// Set also when it has the default value
					if (collectionValues === undefined) {
						nodeParameters[nodeProperties.name] = JSON.parse(JSON.stringify(nodeProperties.default));
					} else {
						nodeParameters[nodeProperties.name] = collectionValues;
					}
					nodeParametersFull[nodeProperties.name] = nodeParameters[nodeProperties.name];
				} else if (collectionValues !== nodeProperties.default) {
					// Set only if values got found and it is not the default
					nodeParameters[nodeProperties.name] = collectionValues;
					nodeParametersFull[nodeProperties.name] = nodeParameters[nodeProperties.name];
				}
			}
		}
	}

	return nodeParameters;
}


/**
 * Brings the output data in a format that can be returned from a node
 *
 * @export
 * @param {INodeExecutionData[]} outputData
 * @param {number} [outputIndex=0]
 * @returns {Promise<INodeExecutionData[][]>}
 */
export async function prepareOutputData(outputData: INodeExecutionData[], outputIndex = 0): Promise<INodeExecutionData[][]> {
	// TODO: Check if node has output with that index
	const returnData = [];

	for (let i = 0; i < outputIndex; i++) {
		returnData.push([]);
	}

	returnData.push(outputData);

	return returnData;
}



/**
 * Returns all the webhooks which should be created for the give node
 *
 * @export
 *
 * @param {INode} node
 * @returns {IWebhookData[]}
 */
export function getNodeWebhooks(workflow: Workflow, node: INode, additionalData: IWorkflowExecuteAdditionalData, ignoreRestartWehbooks = false): IWebhookData[] {
	if (node.disabled === true) {
		// Node is disabled so webhooks will also not be enabled
		return [];
	}

	const nodeType = workflow.nodeTypes.getByName(node.type) as INodeType;

	if (nodeType.description.webhooks === undefined) {
		// Node does not have any webhooks so return
		return [];
	}

	const workflowId = workflow.id || '__UNSAVED__';
	const mode = 'internal';

	const returnData: IWebhookData[] = [];
	for (const webhookDescription of nodeType.description.webhooks) {
		let nodeWebhookPath = workflow.expression.getSimpleParameterValue(node, webhookDescription['path'], mode, {});
		if (nodeWebhookPath === undefined) {
			// TODO: Use a proper logger
			console.error(`No webhook path could be found for node "${node.name}" in workflow "${workflowId}".`);
			continue;
		}

		nodeWebhookPath = nodeWebhookPath.toString();

		if (nodeWebhookPath.startsWith('/')) {
			nodeWebhookPath = nodeWebhookPath.slice(1);
		}
		if (nodeWebhookPath.endsWith('/')) {
			nodeWebhookPath = nodeWebhookPath.slice(0, -1);
		}

		const isFullPath: boolean = workflow.expression.getSimpleParameterValue(node, webhookDescription['isFullPath'], 'internal', {}, false) as boolean;
		const restartWebhook: boolean = workflow.expression.getSimpleParameterValue(node, webhookDescription['restartWebhook'], 'internal', {}, false) as boolean;
		const path = getNodeWebhookPath(workflowId, node, nodeWebhookPath, isFullPath, restartWebhook);

		if (ignoreRestartWehbooks === true && webhookDescription.restartWebhook === true) {
			continue;
		}

		const httpMethod = workflow.expression.getSimpleParameterValue(node, webhookDescription['httpMethod'], mode, {}, 'GET');

		if (httpMethod === undefined) {
			// TODO: Use a proper logger
			console.error(`The webhook "${path}" for node "${node.name}" in workflow "${workflowId}" could not be added because the httpMethod is not defined.`);
			continue;
		}

		let webhookId: string | undefined;
		if ((path.startsWith(':') || path.includes('/:')) && node.webhookId) {
			webhookId = node.webhookId;
		}

		returnData.push({
			httpMethod: httpMethod.toString() as WebhookHttpMethod,
			node: node.name,
			path,
			webhookDescription,
			workflowId,
			workflowExecuteAdditionalData: additionalData,
			webhookId,
		});
	}

	return returnData;
}

export function getNodeWebhooksBasic(workflow: Workflow, node: INode): IWebhookData[] {
	if (node.disabled === true) {
		// Node is disabled so webhooks will also not be enabled
		return [];
	}

	const nodeType = workflow.nodeTypes.getByName(node.type) as INodeType;

	if (nodeType.description.webhooks === undefined) {
		// Node does not have any webhooks so return
		return [];
	}

	const workflowId = workflow.id || '__UNSAVED__';

	const mode = 'internal';

	const returnData: IWebhookData[] = [];
	for (const webhookDescription of nodeType.description.webhooks) {
		let nodeWebhookPath = workflow.expression.getSimpleParameterValue(node, webhookDescription['path'], mode, {});
		if (nodeWebhookPath === undefined) {
			// TODO: Use a proper logger
			console.error(`No webhook path could be found for node "${node.name}" in workflow "${workflowId}".`);
			continue;
		}

		nodeWebhookPath = nodeWebhookPath.toString();

		if (nodeWebhookPath.startsWith('/')) {
			nodeWebhookPath = nodeWebhookPath.slice(1);
		}
		if (nodeWebhookPath.endsWith('/')) {
			nodeWebhookPath = nodeWebhookPath.slice(0, -1);
		}

		const isFullPath: boolean = workflow.expression.getSimpleParameterValue(node, webhookDescription['isFullPath'], mode, {}, false) as boolean;

		const path = getNodeWebhookPath(workflowId, node, nodeWebhookPath, isFullPath);

		const httpMethod = workflow.expression.getSimpleParameterValue(node, webhookDescription['httpMethod'], mode, {});

		if (httpMethod === undefined) {
			// TODO: Use a proper logger
			console.error(`The webhook "${path}" for node "${node.name}" in workflow "${workflowId}" could not be added because the httpMethod is not defined.`);
			continue;
		}

		//@ts-ignore
		returnData.push({
			httpMethod: httpMethod.toString() as WebhookHttpMethod,
			node: node.name,
			path,
			webhookDescription,
			workflowId,
		});
	}

	return returnData;
}


/**
 * Returns the webhook path
 *
 * @export
 * @param {string} workflowId
 * @param {string} nodeTypeName
 * @param {string} path
 * @returns {string}
 */
export function getNodeWebhookPath(workflowId: string, node: INode, path: string, isFullPath?: boolean, restartWebhook?: boolean): string {
	let webhookPath = '';
	if (restartWebhook === true) {
		return path;
	} else if (node.webhookId === undefined) {
		webhookPath = `${workflowId}/${encodeURIComponent(node.name.toLowerCase())}/${path}`;
	} else {
		if (isFullPath === true) {
			return path;
		}
		webhookPath = `${node.webhookId}/${path}`;
	}
	return webhookPath;
}


/**
 * Returns the webhook URL
 *
 * @export
 * @param {string} baseUrl
 * @param {string} workflowId
 * @param {string} nodeTypeName
 * @param {string} path
 * @param {boolean} isFullPath
 * @returns {string}
 */
export function getNodeWebhookUrl(baseUrl: string, workflowId: string, node: INode, path: string, isFullPath?: boolean): string {
	if ((path.startsWith(':') || path.includes('/:')) && node.webhookId) {
		// setting this to false to prefix the webhookId
		isFullPath = false;
	}
	if (path.startsWith('/')) {
		path = path.slice(1);
	}
	return `${baseUrl}/${getNodeWebhookPath(workflowId, node, path, isFullPath)}`;
}


/**
 * Returns all the parameter-issues of the node
 *
 * @export
 * @param {INodeProperties[]} nodePropertiesArray The properties of the node
 * @param {INode} node The data of the node
 * @returns {(INodeIssues | null)}
 */
export function getNodeParametersIssues(nodePropertiesArray: INodeProperties[], node: INode): INodeIssues | null {
	const foundIssues: INodeIssues = {};
	let propertyIssues: INodeIssues;

	if (node.disabled === true) {
		// Ignore issues on disabled nodes
		return null;
	}

	for (const nodeProperty of nodePropertiesArray) {
		propertyIssues = getParameterIssues(nodeProperty, node.parameters, '');
		mergeIssues(foundIssues, propertyIssues);
	}

	if (Object.keys(foundIssues).length === 0) {
		return null;
	}

	return foundIssues;
}


/**
 * Returns the issues of the node as string
 *
 * @export
 * @param {INodeIssues} issues The issues of the node
 * @param {INode} node The node
 * @returns {string[]}
 */
export function nodeIssuesToString(issues: INodeIssues, node?: INode): string[] {
	const nodeIssues = [];

	if (issues.execution !== undefined) {
		nodeIssues.push(`Execution Error.`);
	}

	const objectProperties = [
		'parameters',
		'credentials',
	];

	let issueText: string, parameterName: string;
	for (const propertyName of objectProperties) {
		if (issues[propertyName] !== undefined) {
			for (parameterName of Object.keys(issues[propertyName] as object)) {
				for (issueText of (issues[propertyName] as INodeIssueObjectProperty)[parameterName]) {
					nodeIssues.push(issueText);
				}
			}
		}
	}

	if (issues.typeUnknown !== undefined) {
		if (node !== undefined) {
			nodeIssues.push(`Node Type "${node.type}" is not known.`);
		} else {
			nodeIssues.push(`Node Type is not known.`);
		}
	}

	return nodeIssues;
}


/**
 * Adds an issue if the parameter is not defined
 *
 * @export
 * @param {INodeIssues} foundIssues The already found issues
 * @param {INodeProperties} nodeProperties The properties of the node
 * @param {NodeParameterValue} value The value of the parameter
 */
export function addToIssuesIfMissing(foundIssues: INodeIssues, nodeProperties: INodeProperties, value: NodeParameterValue) {
	// TODO: Check what it really has when undefined
	if ((nodeProperties.type === 'string' && (value === '' || value === undefined)) ||
		(nodeProperties.type === 'multiOptions' && Array.isArray(value) && value.length === 0) ||
		(nodeProperties.type === 'dateTime' && value === undefined)) {
		// Parameter is requried but empty
		if (foundIssues.parameters === undefined) {
			foundIssues.parameters = {};
		}
		if (foundIssues.parameters[nodeProperties.name] === undefined) {
			foundIssues.parameters[nodeProperties.name] = [];
		}

		foundIssues.parameters[nodeProperties.name].push(`Parameter "${nodeProperties.displayName}" is required.`);
	}
}


/**
 * Returns the parameter value
 *
 * @export
 * @param {INodeParameters} nodeValues The values of the node
 * @param {string} parameterName The name of the parameter to return the value of
 * @param {string} path The path to the properties
 * @returns
 */
export function getParameterValueByPath(nodeValues: INodeParameters, parameterName: string, path: string) {
	return get(
		nodeValues,
		path ? path + '.' + parameterName : parameterName,
	);
}



/**
 * Returns all the issues with the given node-values
 *
 * @export
 * @param {INodeProperties} nodeProperties The properties of the node
 * @param {INodeParameters} nodeValues The values of the node
 * @param {string} path The path to the properties
 * @returns {INodeIssues}
 */
export function getParameterIssues(nodeProperties: INodeProperties, nodeValues: INodeParameters, path: string): INodeIssues {
	const foundIssues: INodeIssues = {};
	let value;

	if (nodeProperties.required === true) {
		if (displayParameterPath(nodeValues, nodeProperties, path)) {
			value = getParameterValueByPath(nodeValues, nodeProperties.name, path);

			if (nodeProperties.typeOptions !== undefined && nodeProperties.typeOptions.multipleValues !== undefined) {
				// Multiple can be set so will be an array
				if (Array.isArray(value)) {
					for (const singleValue of value as NodeParameterValue[]) {
						addToIssuesIfMissing(foundIssues, nodeProperties, singleValue as NodeParameterValue);
					}
				}
			} else {
				// Only one can be set so will be a single value
				addToIssuesIfMissing(foundIssues, nodeProperties, value as NodeParameterValue);
			}
		}
	}

	// Check if there are any child parameters
	if (nodeProperties.options === undefined) {
		// There are none so nothing else to check
		return foundIssues;
	}

	// Check the child parameters

	// Important:
	// Checks the child properties only if the property is defined on current level.
	// That means that the required flag works only for the current level only. If
	// it is set on a lower level it means that the property is only required in case
	// the parent property got set.

	let basePath = path ? `${path}.` : '';

	const checkChildNodeProperties: Array<{
		basePath: string;
		data: INodeProperties;
	}> = [];

	// Collect all the properties to check
	if (nodeProperties.type === 'collection') {
		for (const option of nodeProperties.options) {
			checkChildNodeProperties.push({
				basePath,
				data: option as INodeProperties,
			});
		}
	} else if (nodeProperties.type === 'fixedCollection') {
		basePath = basePath ? `${basePath}.` : '' + nodeProperties.name + '.';

		let propertyOptions: INodePropertyCollection;
		for (propertyOptions of nodeProperties.options as INodePropertyCollection[]) {
			// Check if the option got set and if not skip it
			value = getParameterValueByPath(nodeValues, propertyOptions.name, basePath.slice(0, -1));
			if (value === undefined) {
				continue;
			}

			if (nodeProperties.typeOptions !== undefined && nodeProperties.typeOptions.multipleValues !== undefined) {
				// Multiple can be set so will be an array of objects
				if (Array.isArray(value)) {
					for (let i = 0; i < (value as INodeParameters[]).length; i++) {
						for (const option of propertyOptions.values) {
							checkChildNodeProperties.push({
								basePath: `${basePath}${propertyOptions.name}[${i}]`,
								data: option as INodeProperties,
							});
						}
					}
				}
			} else {
				// Only one can be set so will be an object
				for (const option of propertyOptions.values) {
					checkChildNodeProperties.push({
						basePath: basePath + propertyOptions.name,
						data: option as INodeProperties,
					});
				}
			}
		}
	} else {
		// For all other types there is nothing to check so return
		return foundIssues;
	}

	let propertyIssues;

	for (const optionData of checkChildNodeProperties) {
		propertyIssues = getParameterIssues(optionData.data as INodeProperties, nodeValues, optionData.basePath);
		mergeIssues(foundIssues, propertyIssues);
	}

	return foundIssues;
}


/**
 * Merges multiple NodeIssues together
 *
 * @export
 * @param {INodeIssues} destination The issues to merge into
 * @param {(INodeIssues | null)} source The issues to merge
 * @returns
 */
export function mergeIssues(destination: INodeIssues, source: INodeIssues | null) {
	if (source === null) {
		// Nothing to merge
		return;
	}

	if (source.execution === true) {
		destination.execution = true;
	}

	const objectProperties = [
		'parameters',
		'credentials',
	];

	let destinationProperty: INodeIssueObjectProperty;
	for (const propertyName of objectProperties) {
		if (source[propertyName] !== undefined) {
			if (destination[propertyName] === undefined) {
				destination[propertyName] = {};
			}

			let parameterName: string;
			for (parameterName of Object.keys(source[propertyName] as INodeIssueObjectProperty)) {
				destinationProperty = destination[propertyName] as INodeIssueObjectProperty;
				if (destinationProperty[parameterName] === undefined) {
					destinationProperty[parameterName] = [];
				}
				destinationProperty[parameterName].push.apply(destinationProperty[parameterName], (source[propertyName] as INodeIssueObjectProperty)[parameterName]);
			}
		}
	}

	if (source.typeUnknown === true) {
		destination.typeUnknown = true;
	}
}



/**
 * Merges the given node properties
 *
 * @export
 * @param {INodeProperties[]} mainProperties
 * @param {INodeProperties[]} addProperties
 */
export function mergeNodeProperties(mainProperties: INodeProperties[], addProperties: INodeProperties[]): void {
	let existingIndex: number;
	for (const property of addProperties) {
		existingIndex = mainProperties.findIndex(element => element.name === property.name);

		if (existingIndex === -1) {
			// Property does not exist yet, so add
			mainProperties.push(property);
		} else {
			// Property exists already, so overwrite
			mainProperties[existingIndex] = property;
		}
	}
}
