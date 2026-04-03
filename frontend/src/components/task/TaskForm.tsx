import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { Task } from '../../types/api';
import { DatePickerField } from '../ui/DatePickerField';

type TaskFormValues = {
  title: string;
  description: string;
  dueDate: string;
};

type TaskFormProps = {
  initialTask?: Task | null;
  selectedDate?: string | null;
  onSubmit: (payload: { title: string; description?: string; dueDate?: string }) => Promise<void>;
  onCancelEdit: () => void;
};

export const TaskForm = ({ initialTask, selectedDate, onSubmit, onCancelEdit }: TaskFormProps) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<TaskFormValues>({
    defaultValues: {
      title: initialTask?.title ?? '',
      description: initialTask?.description ?? '',
      dueDate: initialTask?.dueDate ?? selectedDate ?? ''
    }
  });

  useEffect(() => {
    reset({
      title: initialTask?.title ?? '',
      description: initialTask?.description ?? '',
      dueDate: initialTask?.dueDate ?? selectedDate ?? ''
    });
  }, [initialTask, selectedDate, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      dueDate: values.dueDate || undefined
    });

    reset({ title: '', description: '', dueDate: selectedDate ?? '' });
  });

  return (
    <section className="composer-card composer-card-closer composer-card-polished composer-card-deluxe composer-card-candy task-form-shell">
      <div className="composer-header composer-header-closer composer-header-polished composer-header-candy task-form-header task-form-header-refined">
        <div className="task-form-heading-block">
          <h2>{initialTask ? 'Редактирование задачи' : 'Новая задача'}</h2>
          <p>Собранный блок без перекосов по высоте: сначала название, потом дата и описание, а действие — отдельной аккуратной строкой снизу.</p>
          <div className="inline-chip-row composer-chip-row task-form-chip-row task-form-chip-row-refined">
            <span className="focus-chip emphasis">{initialTask ? 'Режим редактирования' : 'Быстрое добавление'}</span>
            {selectedDate ? <span className="focus-chip emphasis soft">Дата выбрана в календаре</span> : null}
          </div>
        </div>
      </div>
      <form className="task-form-grid task-form-grid-refined" onSubmit={submit}>
        <label className={`field-group task-form-title ${errors.title ? 'is-invalid' : ''}`}>
          <span className="field-label">Название</span>
          <input
            className="text-input control-large"
            placeholder="Например: Позвонить 5 клиентам"
            aria-invalid={errors.title ? 'true' : 'false'}
            {...register('title', {
              required: 'Введите название задачи.',
              minLength: { value: 2, message: 'Минимум 2 символа.' },
              maxLength: { value: 160, message: 'Максимум 160 символов.' }
            })}
          />
          {errors.title ? <span className="field-error">{errors.title.message}</span> : <span className="field-hint">Лучше формулировать задачу как конкретное действие с понятным результатом.</span>}
        </label>

        <div className="task-form-date">
          <Controller
            control={control}
            name="dueDate"
            render={({ field }) => (
              <DatePickerField
                label="Дата"
                value={field.value}
                onChange={field.onChange}
                hint="Если задача без даты — оставьте поле пустым."
              />
            )}
          />
        </div>

        <label className={`field-group task-form-description ${errors.description ? 'is-invalid' : ''}`}>
          <span className="field-label">Описание</span>
          <textarea
            className="text-area task-form-textarea"
            placeholder="Необязательно"
            aria-invalid={errors.description ? 'true' : 'false'}
            {...register('description', {
              maxLength: { value: 1500, message: 'Максимум 1500 символов.' }
            })}
          />
          {errors.description ? <span className="field-error">{errors.description.message}</span> : <span className="field-hint">Сюда удобно выносить контекст, критерии готовности и короткие детали.</span>}
        </label>

        <div className="composer-actions composer-actions-candy task-form-actions task-form-actions-refined">
          <div className="task-form-actions-copy">
            <span className="field-hint">{initialTask ? 'После сохранения карточка задачи сразу обновится.' : 'После добавления задача сразу появится в списке ниже.'}</span>
          </div>
          <div className="task-form-actions-buttons">
            {initialTask ? (
              <button type="button" className="button button-secondary" onClick={onCancelEdit}>
                Отмена
              </button>
            ) : null}
            <button className="button button-primary task-submit-button task-submit-button-candy" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Сохраняем...' : initialTask ? 'Сохранить задачу' : 'Добавить задачу'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
};
