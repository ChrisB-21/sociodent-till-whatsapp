import React from "react";
import { INDIAN_STATES } from "@/constants/indianStates";

export interface DynamicAddressFieldsProps {
  formData: any;
  updateFormData: (data: any) => void;
  cityQuery: string;
  setCityQuery: (q: string) => void;
  cityResults: any[];
  isLoadingCities: boolean;
  fetchCities: (q: string) => void;
  areaQuery: string;
  setAreaQuery: (q: string) => void;
  areaResults: any[];
  isLoadingAreas: boolean;
  fetchAreas: (q: string) => void;
  setCityResults: (r: any[]) => void;
  setAreaResults: (r: any[]) => void;
  errors: Record<string, string>;
  inputClasses: string;
  errorClasses: string;
  labelClasses: string;
}

const DynamicAddressFields: React.FC<DynamicAddressFieldsProps> = ({
  formData,
  updateFormData,
  cityQuery,
  setCityQuery,
  cityResults,
  isLoadingCities,
  fetchCities,
  areaQuery,
  setAreaQuery,
  areaResults,
  isLoadingAreas,
  fetchAreas,
  setCityResults,
  setAreaResults,
  errors,
  inputClasses,
  errorClasses,
  labelClasses
}) => (
  <>
    <div className="mb-4">
      <label className={labelClasses} htmlFor="stateInput">State</label>
      <select
        id="stateInput"
        className={inputClasses}
        value={formData.state}
        onChange={e => {
          updateFormData({ state: e.target.value, city: "", area: "" });
          setCityQuery("");
          setAreaQuery("");
          setCityResults([]);
          setAreaResults([]);
        }}
      >
        <option value="">Select state</option>
        {INDIAN_STATES.map(state => (
          <option key={state} value={state}>{state}</option>
        ))}
      </select>
      {errors.state && <div className={errorClasses}>{errors.state}</div>}
    </div>
    <div className="mb-4">
      <label className={labelClasses} htmlFor="cityInput">City</label>
      <input
        id="cityInput"
        className={inputClasses}
        placeholder="Type city name"
        value={cityQuery}
        onChange={(e) => {
          setCityQuery(e.target.value);
          fetchCities(e.target.value + (formData.state ? `,${formData.state}` : ""));
        }}
        autoComplete="off"
        disabled={!formData.state}
      />
      {isLoadingCities && <div className="text-sm text-gray-500">Loading cities...</div>}
      <div className="relative">
        {cityResults.length > 0 && (
          <ul className="absolute z-10 bg-white border rounded w-full max-h-40 overflow-y-auto shadow">
            {cityResults.map((city: any) => (
              <li
                key={city.id}
                className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                tabIndex={0}
                role="button"
                onClick={() => {
                  updateFormData({ city: city.text, area: "" });
                  setCityQuery(city.text);
                  setCityResults([]);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    updateFormData({ city: city.text, area: "" });
                    setCityQuery(city.text);
                    setCityResults([]);
                  }
                }}
              >
                {city.text}
              </li>
            ))}
          </ul>
        )}
      </div>
      {errors.city && <div className={errorClasses}>{errors.city}</div>}
    </div>
    <div className="mb-4">
      <label className={labelClasses} htmlFor="areaInput">Area/Locality</label>
      <input
        id="areaInput"
        className={inputClasses}
        placeholder="Type area/locality"
        value={areaQuery}
        onChange={(e) => {
          setAreaQuery(e.target.value);
          fetchAreas(e.target.value + (formData.city ? `,${formData.city}` : ""));
        }}
        autoComplete="off"
        disabled={!formData.city}
      />
      {isLoadingAreas && <div className="text-sm text-gray-500">Loading areas...</div>}
      <div className="relative">
        {areaResults.length > 0 && (
          <ul className="absolute z-10 bg-white border rounded w-full max-h-40 overflow-y-auto shadow">
            {areaResults.map((area: any) => (
              <li
                key={area.id}
                className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                tabIndex={0}
                role="button"
                onClick={() => {
                  updateFormData({ area: area.text });
                  setAreaQuery(area.text);
                  setAreaResults([]);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    updateFormData({ area: area.text });
                    setAreaQuery(area.text);
                    setAreaResults([]);
                  }
                }}
              >
                {area.text}
              </li>
            ))}
          </ul>
        )}
      </div>
      {errors.area && <div className={errorClasses}>{errors.area}</div>}
    </div>
  </>
);

export default DynamicAddressFields;
