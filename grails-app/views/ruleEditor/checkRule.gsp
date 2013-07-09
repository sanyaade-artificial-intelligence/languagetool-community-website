
<g:render template="corpusResult" model="${[searcherResult: searcherResult, expertMode: false, limit: limit]}"/>

<table style="border: 0px">
<tr>
    <td valign="top" width="150"><g:message code="ltc.editor.error.message"/></td>
    <%
    String preset = "Did you mean \"bad\"?";
    %>
    <td><g:textField id="message"
            onkeypress="return handleReturnForXmlCreation(event);"
            onfocus="\$('message').setStyle({color: 'black'})"
            onblur="\$('messageBackup').value = \$('message').value"
            class="preFilledField" type="text" name="message"
            value='${messagePreset ? messagePreset : preset}'/>
        <br/>
        <span class="metaInfo"><g:message code="ltc.editor.error.marker"/></span>
    </td>
</tr>
<tr>
    <td><g:message code="ltc.editor.rule.name"/><br/>
        <span class="metaInfo"><g:message code="ltc.editor.optional"/></span>
    </td>
    <td><g:textField id="name"
            onkeypress="return handleReturnForXmlCreation(event);"
            onfocus="\$('name').setStyle({color: 'black'})"
            onblur="\$('nameBackup').value = \$('name').value"
            class="preFilledField" type="text" name="name"
            value="${(namePreset || messagePreset) ? namePreset.encodeAsHTML() : 'confusion of bed/bad'}"/>
        <!--<br/>
        <span class="metaInfo">Example: confusion of bed/bad</span>-->
    </td>
</tr>
<tr>
    <td></td>
    <td>
        <g:submitToRemote name="createXmlButton"
                          onLoading="onLoadingResult('createXmlSpinner', 'createXmlButton')"
                          onComplete="onResultComplete('createXmlSpinner', 'createXmlButton')"
                          action="createXml" update="xml" value="${message(code:'ltc.editor.create.xml')}"/>
        <img id="createXmlSpinner" style="display: none" src="${resource(dir:'images', file:'spinner.gif')}" alt="wait symbol"/>
    </td>
</tr>
</table>

<script type="text/javascript">
    document.ruleForm.message.select();
</script>
