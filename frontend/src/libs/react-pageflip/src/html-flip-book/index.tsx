import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  ReactNode,
} from 'react';
import type { CSSProperties, ReactElement } from 'react';

import { PageFlip } from '../../node_modules/page-flip/src/PageFlip';
import { SizeType } from '../../node_modules/page-flip/src/Settings';
import type { IFlipSetting, IEventProps } from './settings';

interface IProps extends IFlipSetting, IEventProps {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  renderOnlyPageLengthChange?: boolean;
}

const HTMLFlipBookForward = forwardRef<PageFlip | undefined, IProps>((props, ref) => {
  const htmlElementRef = useRef<HTMLDivElement>(null);
  const childRef = useRef<HTMLElement[]>([]);
  const pageFlip = useRef<PageFlip | null>(null);
  const [pages, setPages] = useState<ReactElement[]>([]);

  // ✅ PageFlip が初期化されていないときでも null を返すように変更
  useImperativeHandle(ref, () => pageFlip.current ?? undefined, []);

  const refreshOnPageDelete = useCallback(() => {
    pageFlip.current?.clear();
  }, []);

  const removeHandlers = useCallback(() => {
    const flip = pageFlip.current;
    if (flip) {
      flip.off('flip');
      flip.off('changeOrientation');
      flip.off('changeState');
      flip.off('init');
      flip.off('update');
    }
  }, []);

  useEffect(() => {
    childRef.current = [];

    const childList = React.Children.map(props.children, (child) =>
      React.cloneElement(child as ReactElement, {
        ref: (dom: HTMLElement) => {
          if (dom) childRef.current.push(dom);
        },
      })
    ) || [];

    if (!props.renderOnlyPageLengthChange || pages.length !== childList.length) {
      if (childList.length < pages.length) {
        refreshOnPageDelete();
      }
      setPages(childList);
    }
  }, [props.children]);

  useEffect(() => {
    const setHandlers = () => {
      const flip = pageFlip.current;
      if (!flip) return;

      props.onFlip && flip.on('flip', props.onFlip);
      props.onChangeOrientation && flip.on('changeOrientation', props.onChangeOrientation);
      props.onChangeState && flip.on('changeState', props.onChangeState);
      props.onInit && flip.on('init', props.onInit);
      props.onUpdate && flip.on('update', props.onUpdate);
    };

    if (pages.length > 0 && childRef.current.length > 0) {
      removeHandlers();

      const processedSetting = {
        ...props,
        size: props.size === 'stretch' ? SizeType.STRETCH : SizeType.FIXED,
      };

      if (htmlElementRef.current && !pageFlip.current) {
        pageFlip.current = new PageFlip(htmlElementRef.current, processedSetting);
      }

      if (pageFlip.current) {
        if (!pageFlip.current.getFlipController()) {
          pageFlip.current.loadFromHTML(childRef.current);
        } else {
          pageFlip.current.updateFromHtml(childRef.current);
        }
      }

      setHandlers();
    }
  }, [pages]);

  return (
    <div ref={htmlElementRef} className={props.className} style={props.style}>
      {pages}
    </div>
  );
});

export const HTMLFlipBook = React.memo(HTMLFlipBookForward);
