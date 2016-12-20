// tslint:disable-next-line:no-any
export default function type(node: any): string {
  return node.constructor.name;
}
