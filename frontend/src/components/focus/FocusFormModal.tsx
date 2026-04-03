import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Focus, FocusSummary } from '../../types/api';
import { Modal } from '../ui/Modal';
import { fileUrl } from '../../api/client';
import { formatPhone, isValidPhone, normalizePhone } from '../../utils/phone';
import { useAuth } from '../../context/AuthContext';

type FocusFormValues = {
  title: string;
  description: string;
  coverImage: FileList;
};

type FocusFormModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialFocus?: Focus | FocusSummary | null;
  onClose: () => void;
  onSubmit: (payload: FormData) => Promise<void>;
};

export const FocusFormModal = ({ open, mode, initialFocus, onClose, onSubmit }: FocusFormModalProps) => {
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FocusFormValues>({
    defaultValues: {
      title: initialFocus?.title ?? '',
      description: initialFocus?.description ?? ''
    }
  });

  const existingPhones = useMemo(() => initialFocus?.members?.map((member) => member.phone) ?? [], [initialFocus]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialFocus?.coverImage ? fileUrl(initialFocus.coverImage) : null);
  const [collaboratorPhones, setCollaboratorPhones] = useState<string[]>(existingPhones);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const fileList = watch('coverImage');

  useEffect(() => {
    reset({
      title: initialFocus?.title ?? '',
      description: initialFocus?.description ?? ''
    });
    setPreviewUrl(initialFocus?.coverImage ? fileUrl(initialFocus.coverImage) : null);
    setCollaboratorPhones(existingPhones);
    setPhoneInput('');
    setPhoneError(null);
  }, [existingPhones, initialFocus, reset]);

  useEffect(() => {
    const file = fileList?.item(0);
    if (!file) return;
    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [fileList]);

  const addPhone = () => {
    const normalized = normalizePhone(phoneInput);

    if (!normalized) {
      setPhoneError('Введите номер телефона участника.');
      return;
    }

    if (!isValidPhone(normalized)) {
      setPhoneError('Номер телефона выглядит некорректно.');
      return;
    }

    if (user && normalized === user.phone) {
      setPhoneError('Вы уже владелец этого Focus, себя добавлять не нужно.');
      return;
    }

    if (collaboratorPhones.includes(normalized)) {
      setPhoneError('Этот человек уже добавлен в список участников.');
      return;
    }

    if (collaboratorPhones.length >= 12) {
      setPhoneError('В одном Focus пока можно добавить до 12 участников.');
      return;
    }

    setCollaboratorPhones((current) => [...current, normalized]);
    setPhoneInput('');
    setPhoneError(null);
  };

  const removePhone = (phone: string) => {
    setCollaboratorPhones((current) => current.filter((item) => item !== phone));
    setPhoneError(null);
  };

  const submit = handleSubmit(async (values) => {
    const payload = new FormData();
    payload.append('title', values.title.trim());
    payload.append('description', values.description.trim());
    payload.append('collaboratorPhones', JSON.stringify(collaboratorPhones));
    const file = values.coverImage?.item(0);
    if (file) payload.append('coverImage', file);
    await onSubmit(payload);
    onClose();
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Новый Focus' : 'Редактировать Focus'}
      subtitle="Добавьте обложку, описание и участников по номеру телефона — с нормальными проверками и аккуратной подачей"
      size="wide"
      footer={
        <>
          <button type="button" className="button button-secondary" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" form="focus-form" className="button button-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </>
      }
    >
      <form id="focus-form" className="stack-xl" onSubmit={submit}>
        <div className="modal-intro-card">
          <div>
            <strong>{mode === 'create' ? 'Соберите новый workspace' : 'Обновите пространство аккуратно'}</strong>
            <p>Название, цель, обложка и состав команды теперь собраны в более чистый и предсказуемый flow.</p>
          </div>
          <div className="inline-chip-row">
            <span className="focus-chip emphasis">{collaboratorPhones.length + 1} участников</span>
            <span className="focus-chip emphasis soft">до 12 приглашений</span>
          </div>
        </div>

        <div className="modal-section-grid">
          <label className={`field-group modal-main-column ${errors.title ? 'is-invalid' : ''}`}>
            <span className="field-label">Название</span>
            <input
              className="text-input control-large"
              placeholder="Например: SaaS продукт"
              aria-invalid={errors.title ? 'true' : 'false'}
              {...register('title', {
                required: 'Введите название.',
                minLength: { value: 2, message: 'Минимум 2 символа.' },
                maxLength: { value: 120, message: 'Максимум 120 символов.' }
              })}
            />
            {errors.title ? <span className="field-error">{errors.title.message}</span> : <span className="field-hint">Лучше коротко и по сути: продукт, продажи, контент, клиенты.</span>}
          </label>

          <label className={`field-group modal-main-column ${errors.description ? 'is-invalid' : ''}`}>
            <span className="field-label">Описание</span>
            <textarea
              className="text-area"
              rows={4}
              placeholder="Коротко опишите цель Focus"
              aria-invalid={errors.description ? 'true' : 'false'}
              {...register('description', {
                required: 'Введите описание.',
                minLength: { value: 8, message: 'Описание должно быть чуть подробнее.' },
                maxLength: { value: 1000, message: 'Максимум 1000 символов.' }
              })}
            />
            {errors.description ? <span className="field-error">{errors.description.message}</span> : <span className="field-hint">Опишите, ради чего этот Focus существует и какой результат в нём должен появиться.</span>}
          </label>
        </div>

        <div className="focus-settings-grid focus-settings-grid-polished">
          <label className="field-group">
            <span className="field-label">Обложка</span>
            <div className="upload-box upload-box-large upload-box-premium">
              <div
                className="focus-preview focus-preview-large"
                style={previewUrl ? { backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.58)), url(${previewUrl})` } : undefined}
              />
              <input className="text-input" type="file" accept="image/*" {...register('coverImage')} />
              <span className="field-hint">Поддерживается одно изображение до 5 MB. Лучше использовать горизонтальную картинку без мелких деталей.</span>
            </div>
          </label>

          <div className="field-group">
            <span className="field-label">Участники Focus</span>
            <div className="team-box team-box-polished team-box-elevated">
              <div className="team-box-head">
                <div>
                  <strong>Командный доступ</strong>
                  <p>Добавляйте только зарегистрированных пользователей. Телефон автоматически нормализуется.</p>
                </div>
                <span className="focus-chip emphasis soft">{collaboratorPhones.length}/12</span>
              </div>

              <div className="phone-input-row phone-input-row-polished">
                <input
                  className={`text-input ${phoneError ? 'input-error-state' : ''}`}
                  value={phoneInput}
                  onChange={(event) => {
                    setPhoneInput(event.target.value);
                    if (phoneError) setPhoneError(null);
                  }}
                  onBlur={() => setPhoneInput((current) => normalizePhone(current))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addPhone();
                    }
                  }}
                  placeholder="+7 930 750 75 43"
                />
                <button className="button button-secondary" type="button" onClick={addPhone}>
                  Добавить
                </button>
              </div>

              {phoneError ? <span className="field-error">{phoneError}</span> : <span className="field-hint">Нельзя добавить себя, дубли и больше 12 участников.</span>}

              <div className="team-chip-grid team-chip-grid-polished">
                {collaboratorPhones.length ? (
                  collaboratorPhones.map((phone) => (
                    <div key={phone} className="team-chip team-chip-polished team-chip-rich">
                      <div>
                        <strong>{formatPhone(phone)}</strong>
                        <span>Участник команды</span>
                      </div>
                      <button type="button" className="team-chip-remove" onClick={() => removePhone(phone)}>
                        ✕
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="subtle-empty-card">Пока в Focus только вы. Добавьте людей по номеру телефона, когда захотите работать вместе.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};
