/* eslint @typescript-eslint/no-unsafe-call: 0 -- EUI icon imports don't get on with Vite */
/* eslint @typescript-eslint/no-unsafe-assignment: 0 -- EUI icon imports don't get on with Vite */

import { icon as arrowDown } from '@elastic/eui/es/components/icon/assets/arrow_down';
import { icon as arrowLeft } from '@elastic/eui/es/components/icon/assets/arrow_left';
import { icon as arrowRight } from '@elastic/eui/es/components/icon/assets/arrow_right';
import { icon as arrowEnd } from '@elastic/eui/es/components/icon/assets/arrowEnd';
import { icon as arrowStart } from '@elastic/eui/es/components/icon/assets/arrowStart';
import { icon as boxesHorizontal } from '@elastic/eui/es/components/icon/assets/boxes_horizontal';
import { icon as boxesVertical } from '@elastic/eui/es/components/icon/assets/boxes_vertical';
import { icon as check } from '@elastic/eui/es/components/icon/assets/check';
import { icon as clock } from '@elastic/eui/es/components/icon/assets/clock';
import { icon as copyClipboard } from '@elastic/eui/es/components/icon/assets/copy_clipboard';
import { icon as cross } from '@elastic/eui/es/components/icon/assets/cross';
import { icon as dot } from '@elastic/eui/es/components/icon/assets/dot';
import { icon as doubleArrowLeft } from '@elastic/eui/es/components/icon/assets/doubleArrowLeft';
import { icon as empty } from '@elastic/eui/es/components/icon/assets/empty';
import { icon as faceSad } from '@elastic/eui/es/components/icon/assets/face_sad';
import { icon as heart } from '@elastic/eui/es/components/icon/assets/heart';
import { icon as launch } from '@elastic/eui/es/components/icon/assets/launch';
import { icon as link } from '@elastic/eui/es/components/icon/assets/link';
import { icon as menu } from '@elastic/eui/es/components/icon/assets/menu';
import { icon as menuLeft } from '@elastic/eui/es/components/icon/assets/menuLeft';
import { icon as menuRight } from '@elastic/eui/es/components/icon/assets/menuRight';
import { icon as popout } from '@elastic/eui/es/components/icon/assets/popout';
import { icon as refresh } from '@elastic/eui/es/components/icon/assets/refresh';
import { icon as returnKey } from '@elastic/eui/es/components/icon/assets/return_key';
import { icon as search } from '@elastic/eui/es/components/icon/assets/search';
import { icon as starEmpty } from '@elastic/eui/es/components/icon/assets/star_empty';
import { icon as starFilled } from '@elastic/eui/es/components/icon/assets/star_filled';
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
	refresh,
	menuRight,
	menuLeft,
	boxesVertical,
	boxesHorizontal,
	launch,
	heart,
	link,
	copyClipboard,
	popout,
	starEmpty,
	starFilled,
});
