import React, { lazy, Suspense } from 'react';
import { Tabs } from 'antd'; // 引入 Ant Design 的 Tabs 组件
import { totalStat } from '@assets/index';
import { loadSvgComponent } from '@/utils/svgUtils';
import { BUTTON_TITLES } from '@/utils/const';

// Lazy load both github.svg and grid.svg
const GithubSvg = lazy(() => loadSvgComponent(totalStat, './github.svg'));
const GridSvg = lazy(() => loadSvgComponent(totalStat, './grid.svg'));

const { TabPane } = Tabs; // 获取 Tabs 的子组件 TabPane

const SVGStat = () => {
  return (
    <div id="svgStat">
      {/* Ant Design Tabs 实现 Tabs 切换 */}
      <Tabs
        defaultActiveKey="grid"
        centered
        type="line"
        tabBarStyle={{ fontSize: '16px', fontWeight: 'bold' }}
      >
        {/* Tab 1: GridSvg */}
        <TabPane
          tab={
            <span className="tab-title text-2xl">
              {BUTTON_TITLES.SWITCH_GRID_BUTTON}
            </span>
          }
          key="grid"
        >
          <Suspense fallback={<div className="text-center">Loading...</div>}>
            <GridSvg className="mt-4 h-auto w-full rounded-xl shadow-md" />
          </Suspense>
        </TabPane>

        {/* Tab 2: GithubSvg */}
        <TabPane
          tab={
            <span className="tab-title text-2xl">
              {BUTTON_TITLES.SWITCH_GITHUB_BUTTON}
            </span>
          }
          key="github"
        >
          <Suspense fallback={<div className="text-center">Loading...</div>}>
            <GithubSvg className="mt-4 h-auto w-full rounded-xl shadow-md" />
          </Suspense>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default SVGStat;
