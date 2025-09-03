/* eslint @typescript-eslint/no-unsafe-call: 0 -- EUI icon imports don't get on with Vite */
/* eslint @typescript-eslint/no-unsafe-assignment: 0 -- EUI icon imports don't get on with Vite */

import { icon as arrowDown } from '@elastic/eui/es/components/icon/assets/arrow_down';
import { icon as arrowLeft } from '@elastic/eui/es/components/icon/assets/arrow_left';
import { icon as arrowRight } from '@elastic/eui/es/components/icon/assets/arrow_right';
import { icon as arrowUp } from '@elastic/eui/es/components/icon/assets/arrow_up';
import { icon as arrowEnd } from '@elastic/eui/es/components/icon/assets/arrowEnd';
import { icon as arrowStart } from '@elastic/eui/es/components/icon/assets/arrowStart';
import { icon as boxesHorizontal } from '@elastic/eui/es/components/icon/assets/boxes_horizontal';
import { icon as boxesVertical } from '@elastic/eui/es/components/icon/assets/boxes_vertical';
import { icon as calendar } from '@elastic/eui/es/components/icon/assets/calendar';
import { icon as check } from '@elastic/eui/es/components/icon/assets/check';
import { icon as clock } from '@elastic/eui/es/components/icon/assets/clock';
import { icon as copyClipboard } from '@elastic/eui/es/components/icon/assets/copy_clipboard';
import { icon as cross } from '@elastic/eui/es/components/icon/assets/cross';
import { icon as dot } from '@elastic/eui/es/components/icon/assets/dot';
import { icon as doubleArrowLeft } from '@elastic/eui/es/components/icon/assets/doubleArrowLeft';
import { icon as empty } from '@elastic/eui/es/components/icon/assets/empty';
import { icon as error } from '@elastic/eui/es/components/icon/assets/error';
import { icon as faceSad } from '@elastic/eui/es/components/icon/assets/face_sad';
import { icon as filter } from '@elastic/eui/es/components/icon/assets/filter';
import { icon as flask } from '@elastic/eui/es/components/icon/assets/flask';
import { icon as gear } from '@elastic/eui/es/components/icon/assets/gear';
import { icon as heart } from '@elastic/eui/es/components/icon/assets/heart';
import { icon as info } from '@elastic/eui/es/components/icon/assets/info';
import { icon as kqlFunction } from '@elastic/eui/es/components/icon/assets/kql_function';
import { icon as launch } from '@elastic/eui/es/components/icon/assets/launch';
import { icon as link } from '@elastic/eui/es/components/icon/assets/link';
import { icon as menu } from '@elastic/eui/es/components/icon/assets/menu';
import { icon as menuLeft } from '@elastic/eui/es/components/icon/assets/menuLeft';
import { icon as menuRight } from '@elastic/eui/es/components/icon/assets/menuRight';
import { icon as pin } from '@elastic/eui/es/components/icon/assets/pin_filled';
import { icon as plusInCircle } from '@elastic/eui/es/components/icon/assets/plus_in_circle';
import { icon as popout } from '@elastic/eui/es/components/icon/assets/popout';
import { icon as refresh } from '@elastic/eui/es/components/icon/assets/refresh';
import { icon as returnKey } from '@elastic/eui/es/components/icon/assets/return_key';
import { icon as search } from '@elastic/eui/es/components/icon/assets/search';
import { icon as sortLeft } from '@elastic/eui/es/components/icon/assets/sortLeft';
import { icon as sortRight } from '@elastic/eui/es/components/icon/assets/sortRight';
import { icon as visTable } from '@elastic/eui/es/components/icon/assets/vis_table';
import { icon as warning } from '@elastic/eui/es/components/icon/assets/warning';
import { appendIconComponentCache } from '@elastic/eui/es/components/icon/icon';

const icons = {
	calendar,
	clock,
	arrowDown,
	arrowUp,
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
	sortRight,
	sortLeft,
	pin,
	info,
	kqlFunction,
	filter,
	plusInCircle,
	error,
	gear,
	flask,
	visTable,
};

// One or more icons are passed in as an object of iconKey (string): IconComponent
appendIconComponentCache(icons);

export const setUpIcons = () => {
	appendIconComponentCache(icons);
};
