import { Save } from "lucide-react";
import { submitQuestionnaireAction } from "@/app/actions";
import { HAWKINS_OPTIONS } from "@/lib/domain";
import type { LogType, PracticeEvent, QuestionnaireResponse } from "@/lib/types";

export function QuestionnaireForm({
  event,
  logType,
  existing
}: {
  event: PracticeEvent;
  logType: LogType;
  existing?: QuestionnaireResponse;
}) {
  const isBefore = logType === "before";

  return (
    <form className="form" action={submitQuestionnaireAction}>
      <input type="hidden" name="eventId" value={event.id} />
      <input type="hidden" name="logType" value={logType} />

      <section className="notice">
        <p>
          The data collected through this questionnaire will be recorded anonymously. By completing this questionnaire,
          you acknowledge and agree that the anonymous data you provide can be used for the analysis of this experiment.
          This experiment is intended only for self-observation, learning, and discussion purposes, and does not
          constitute medical diagnosis, medical advice, or psychological counseling.
        </p>
        <p>
          本问卷所收集的数据将以匿名形式记录。填写本问卷即表示您已知情并同意，所提供的匿名数据仅用于本次实验分析。本实验仅用于自我观察与学习交流，不构成医学诊断、治疗建议或心理咨询建议。
        </p>
      </section>

      <div className="field">
        <label htmlFor="practice">Practice / 练习项目</label>
        <input id="practice" name="practice" value={event.title} readOnly />
      </div>

      <fieldset>
        <legend>Hawkins Scale / 霍金斯意识能量等级</legend>
        <p className="muted" id="hawkins-helper">
          Choose the state that best matches your current inner experience. / 请选择最符合你当下内在体验的状态。
        </p>
        <p className="muted">
          This is a self-observation scale, not a clinical measurement. / 这是自我观察量表，不是临床测量。
        </p>
        <div className="hawkins-list" aria-describedby="hawkins-helper">
          {HAWKINS_OPTIONS.map((option) => (
            <label className="hawkins-option" key={option.value}>
              <span className="color-chip" style={{ background: option.color }} aria-hidden="true" />
              <span>
                <input
                  required
                  type="radio"
                  name="hawkinsValue"
                  value={option.value}
                  defaultChecked={existing?.hawkinsValue === option.value}
                />{" "}
                <strong>
                  {option.english} / {option.chinese}
                </strong>
                <br />
                <span className="muted">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="two-col">
        <div className="field">
          <label htmlFor="glucoseValue">Glucose from CGM, if available / CGM 血糖数据（如有）</label>
          <input
            id="glucoseValue"
            name="glucoseValue"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            placeholder="mg/dL"
            defaultValue={existing?.glucoseValue ?? ""}
          />
        </div>
        <div className="field">
          <label htmlFor="heartRateBpm">Heart rate from watch or wearable, if available / 手表或可穿戴设备心率数据（如有）</label>
          <input
            id="heartRateBpm"
            name="heartRateBpm"
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="bpm"
            defaultValue={existing?.heartRateBpm ?? ""}
          />
        </div>
      </div>

      {isBefore ? (
        <fieldset>
          <legend>Did you have food or drink before practice? / 练习前你是否摄入了食物或饮品？</legend>
          <div className="actions">
            <label className="pill">
              <input
                type="radio"
                name="hadFoodDrinkBefore"
                value="yes"
                defaultChecked={existing?.hadFoodDrinkBefore === true}
              />{" "}
              Yes / 是
            </label>
            <label className="pill">
              <input
                type="radio"
                name="hadFoodDrinkBefore"
                value="no"
                defaultChecked={existing?.hadFoodDrinkBefore === false}
              />{" "}
              No / 否
            </label>
          </div>
          <div className="field" style={{ marginTop: "0.75rem" }}>
            <label htmlFor="foodDrinkDetail">What did you have? / 你摄入了什么？</label>
            <input id="foodDrinkDetail" name="foodDrinkDetail" defaultValue={existing?.foodDrinkDetail ?? ""} />
          </div>
        </fieldset>
      ) : null}

      <div className="field">
        <label htmlFor="stressScore">Stress score, if available / 压力评分（如有）</label>
        <input id="stressScore" name="stressScore" defaultValue={existing?.stressScore ?? ""} />
      </div>

      <div className="field">
        <label htmlFor="note">Note / 备注</label>
        <p className="muted" id="note-helper">
          Anything else you want to add. Please avoid including names, contact information, or other identifying
          details. / 任何你想补充的内容。请避免填写姓名、联系方式或其他可识别个人身份的信息。
        </p>
        <textarea
          id="note"
          name="note"
          maxLength={1000}
          aria-describedby="note-helper"
          defaultValue={existing?.note ?? ""}
        />
        <p className="muted">Maximum 1000 characters / 最多 1000 字符</p>
      </div>

      <button type="submit">
        <Save size={18} aria-hidden="true" />
        Submit {logType} log / 提交{isBefore ? "练习前" : "练习后"}记录
      </button>
    </form>
  );
}
