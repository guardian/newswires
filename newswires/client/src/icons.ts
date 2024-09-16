/* eslint @typescript-eslint/no-unsafe-call: 0 -- EUI icon imports don't get on with Vite */
/* eslint @typescript-eslint/no-unsafe-assignment: 0 -- EUI icon imports don't get on with Vite */

import { icon as arrowDown } from '@elastic/eui/es/components/icon/assets/arrow_down';
import { icon as arrowLeft } from '@elastic/eui/es/components/icon/assets/arrow_left';
import { icon as arrowRight } from '@elastic/eui/es/components/icon/assets/arrow_right';
import { icon as arrowEnd } from '@elastic/eui/es/components/icon/assets/arrowEnd';
import { icon as arrowStart } from '@elastic/eui/es/components/icon/assets/arrowStart';
import { icon as check } from '@elastic/eui/es/components/icon/assets/check';
import { icon as clock } from '@elastic/eui/es/components/icon/assets/clock';
import { icon as cross } from '@elastic/eui/es/components/icon/assets/cross';
import { icon as dot } from '@elastic/eui/es/components/icon/assets/dot';
import { icon as doubleArrowLeft } from '@elastic/eui/es/components/icon/assets/doubleArrowLeft';
import { icon as empty } from '@elastic/eui/es/components/icon/assets/empty';
import { icon as faceSad } from '@elastic/eui/es/components/icon/assets/face_sad';
import { icon as menu } from '@elastic/eui/es/components/icon/assets/menu';
import { icon as returnKey } from '@elastic/eui/es/components/icon/assets/return_key';
import { icon as search } from '@elastic/eui/es/components/icon/assets/search';
import { icon as warning } from '@elastic/eui/es/components/icon/assets/warning';
import { appendIconComponentCache } from '@elastic/eui/es/components/icon/icon';

// One or more icons are passed in as an object of iconKey (string): IconComponent
appendIconComponentCache({
	clock,
	arrowDown,
	arrowLeft,
	arrowRight,
	arrowEnd,
	arrowStart,
	dot,
	cross,
	menu,
	doubleArrowLeft,
	search,
	faceSad,
	warning,
	empty,
	returnKey,
	check,
});
