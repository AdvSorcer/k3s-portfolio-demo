{{- define "laptop-advise.fullname" -}}
{{- .Release.Name -}}
{{- end -}}

{{- define "laptop-advise.postgresName" -}}
{{ include "laptop-advise.fullname" . }}-postgres
{{- end -}}
