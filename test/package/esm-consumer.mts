import Heatbox, { Heatbox as NamedHeatbox, VERSION, getEnvironmentInfo } from 'cesium-heatbox';

const defaultConstructor: typeof Heatbox = Heatbox;
const namedConstructor: typeof Heatbox = NamedHeatbox;
const version: string = VERSION;
const cesiumVersion: string = getEnvironmentInfo().cesiumVersion;

void defaultConstructor;
void namedConstructor;
void version;
void cesiumVersion;
