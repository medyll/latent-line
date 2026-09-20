import { clsx, type ClassValue } from 'clsx';

/** Joins class names, dropping the falsy ones. */
export function cn(...inputs: ClassValue[]) {
	return clsx(inputs);
}

/** Drops the `child` snippet prop from a component's props. */
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;

/** Drops the `children` snippet prop from a component's props. */
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
/** Drops both snippet props from a component's props. */
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
/** Adds a bindable `ref` to the underlying element. */
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
