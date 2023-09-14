// language infrastructure functions. should be kept as light as possible as
// this will be imported everywhere.

//
// decorators
//

// override(...) is from https://github.com/Microsoft/TypeScript/issues/2000

/**
 * Method decorator that ensures a super function really is being overridden.
 * @param target
 * @param propertyKey
 * @param descriptor
 */
function override(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
	var baseType = Object.getPrototypeOf(target);
	if (typeof baseType[propertyKey] !== 'function') {
		throw new Error('Method ' + propertyKey + ' of ' + target.constructor.name + ' does not override any base class method');
	}
}
