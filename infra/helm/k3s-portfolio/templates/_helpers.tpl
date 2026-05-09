{{- define "k3s-portfolio.name" -}}
{{- .Chart.Name -}}
{{- end -}}

{{- define "k3s-portfolio.fullname" -}}
{{- .Release.Name -}}
{{- end -}}

