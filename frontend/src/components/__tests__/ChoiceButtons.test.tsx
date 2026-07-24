import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChoiceButtons from '../game/ChoiceButtons';

/**
 * ChoiceButtons 选项按钮组件测试
 *
 * 覆盖：
 * - 渲染选项按钮（单个 / 多个）
 * - 点击选项触发 onSelect 回调（传递 choice 和 index）
 * - 禁用状态（disabled）
 * - 空选项不渲染
 * - 选项序号字母标记（A. B. C. ...）
 */
describe('ChoiceButtons', () => {
  it('应渲染所有选项按钮', () => {
    render(
      <ChoiceButtons
        choices={['进入城堡', '原地观察', '返回村庄']}
        onSelect={vi.fn()}
      />,
    );

    // 应渲染 3 个按钮
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);

    // 每个按钮应包含对应文本
    expect(screen.getByText('进入城堡')).toBeInTheDocument();
    expect(screen.getByText('原地观察')).toBeInTheDocument();
    expect(screen.getByText('返回村庄')).toBeInTheDocument();
  });

  it('点击选项应触发 onSelect 并传递 choice 和 index', () => {
    const onSelect = vi.fn();

    render(
      <ChoiceButtons choices={['选项A', '选项B']} onSelect={onSelect} />,
    );

    // 点击第一个选项
    fireEvent.click(screen.getByText('选项A'));
    expect(onSelect).toHaveBeenCalledWith('选项A', 0);

    // 点击第二个选项
    fireEvent.click(screen.getByText('选项B'));
    expect(onSelect).toHaveBeenCalledWith('选项B', 1);

    // 应被调用 2 次
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('disabled 为 true 时按钮应被禁用且不可点击', () => {
    const onSelect = vi.fn();

    render(
      <ChoiceButtons
        choices={['选项A', '选项B']}
        onSelect={onSelect}
        disabled
      />,
    );

    const buttons = screen.getAllByRole('button');
    // 所有按钮应被禁用
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });

    // 点击禁用按钮不应触发回调
    fireEvent.click(buttons[0]);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('disabled 为 false 时按钮应可点击', () => {
    const onSelect = vi.fn();

    render(
      <ChoiceButtons
        choices={['选项A']}
        onSelect={onSelect}
        disabled={false}
      />,
    );

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('空选项数组不应渲染任何按钮', () => {
    const { container } = render(
      <ChoiceButtons choices={[]} onSelect={vi.fn()} />,
    );

    // 容器内不应有按钮
    expect(container.querySelector('button')).toBeNull();
  });

  it('choices 为 undefined 时不应渲染', () => {
    const { container } = render(
      <ChoiceButtons choices={undefined as any} onSelect={vi.fn()} />,
    );

    expect(container.querySelector('button')).toBeNull();
  });

  it('每个选项应显示字母序号标记（A. B. C. ...）', () => {
    render(
      <ChoiceButtons
        choices={['第一项', '第二项', '第三项']}
        onSelect={vi.fn()}
      />,
    );

    // A. B. C. 序号标记
    expect(screen.getByText('A.')).toBeInTheDocument();
    expect(screen.getByText('B.')).toBeInTheDocument();
    expect(screen.getByText('C.')).toBeInTheDocument();
  });

  it('单个选项也应正常渲染', () => {
    const onSelect = vi.fn();

    render(<ChoiceButtons choices={['唯一选项']} onSelect={onSelect} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(screen.getByText('唯一选项')).toBeInTheDocument();

    fireEvent.click(buttons[0]);
    expect(onSelect).toHaveBeenCalledWith('唯一选项', 0);
  });
});
